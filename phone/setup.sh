#!/usr/bin/env bash
# Gains Support Line: sets up (or updates) the phone line in Amazon Connect.
# Run it in AWS CloudShell (the >_ icon in the AWS console's top bar):
#
#   git clone https://github.com/tattoobrando/sudogetbig.git
#   cd sudogetbig/phone && bash setup.sh
#
# Safe to rerun: it reuses the instance, number and flow it finds, and just
# pushes the latest flow.json. It asks before anything that costs money.
set -euo pipefail
cd "$(dirname "$0")"

REGION="${PHONE_REGION:-us-west-2}"   # Oregon: closest Connect region to Phoenix
ALIAS="${PHONE_ALIAS:-sudogetbig-gains}"
FLOW_NAME="Gains Support Line"
AREA_CODES=(602 480 623)              # Phoenix area codes, in order of preference
BUDGET_USD=25
export AWS_REGION="$REGION" AWS_DEFAULT_REGION="$REGION" AWS_PAGER=""

G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; B=$'\033[1m'; X=$'\033[0m'
say() { printf '%s\n' "$*"; }
ok() { say "${G}✓${X} $*"; }
die() { say "${R}✗ $*${X}"; exit 1; }
none() { [ -z "$1" ] || [ "$1" = "None" ] || [ "$1" = "null" ]; }

command -v aws >/dev/null || die "Run this in AWS CloudShell (it has the aws command built in)."
[ -f flow.json ] || die "flow.json is missing. Run this from the phone/ folder."
ACCOUNT=$(aws sts get-caller-identity --query Account --output text) || die "Not signed in to AWS."
say "${B}Gains Support Line setup${X} · account $ACCOUNT · region $REGION"
say ""

# ---------------------------------------------------------------- 1. Connect instance
read -r INSTANCE_ID INSTANCE_ARN <<<"$(aws connect list-instances \
  --query "InstanceSummaryList[?InstanceAlias=='$ALIAS'] | [0].[Id,Arn]" --output text)"
if none "$INSTANCE_ID"; then
  say "Creating Amazon Connect instance '$ALIAS' (inbound calls only)…"
  OUT=$(aws connect create-instance \
    --identity-management-type CONNECT_MANAGED --instance-alias "$ALIAS" \
    --inbound-calls-enabled --no-outbound-calls-enabled \
    --query '[Id,Arn]' --output text) ||
    die "Couldn't create the instance. If the name is taken, rerun with: PHONE_ALIAS=some-other-name bash setup.sh"
  read -r INSTANCE_ID INSTANCE_ARN <<<"$OUT"
fi
for _ in $(seq 1 60); do
  STATUS=$(aws connect describe-instance --instance-id "$INSTANCE_ID" --query Instance.InstanceStatus --output text)
  [ "$STATUS" = ACTIVE ] && break
  [ "$STATUS" = CREATION_FAILED ] && die "Instance creation failed. Check Amazon Connect in the console."
  printf '\r  waiting for the instance to finish creating (%s)…' "$STATUS"; sleep 5
done
printf '\r\033[K'
[ "$STATUS" = ACTIVE ] || die "Instance still isn't active after 5 minutes. Rerun the script in a bit."
ok "Instance: $ALIAS ($INSTANCE_ID)"

# ---------------------------------------------------------------- 2. Contact flow
FLOW_ID=$(aws connect list-contact-flows --instance-id "$INSTANCE_ID" --contact-flow-types CONTACT_FLOW \
  --query "ContactFlowSummaryList[?Name=='$FLOW_NAME'] | [0].Id" --output text)
if none "$FLOW_ID"; then
  FLOW_ID=$(aws connect create-contact-flow --instance-id "$INSTANCE_ID" --name "$FLOW_NAME" \
    --type CONTACT_FLOW --description "sudogetbig.com phone line" --content file://flow.json \
    --query ContactFlowId --output text) || die "Amazon Connect rejected flow.json. Send Claude the error above."
  ok "Flow created: $FLOW_NAME"
else
  aws connect update-contact-flow-content --instance-id "$INSTANCE_ID" --contact-flow-id "$FLOW_ID" \
    --content file://flow.json || die "Amazon Connect rejected flow.json. Send Claude the error above."
  ok "Flow updated: $FLOW_NAME"
fi

# ---------------------------------------------------------------- 3. Phone number
read -r NUMBER_ID NUMBER <<<"$(aws connect list-phone-numbers-v2 --target-arn "$INSTANCE_ARN" \
  --query 'ListPhoneNumbersSummaryList[0].[PhoneNumberId,PhoneNumber]' --output text)"
if none "$NUMBER_ID"; then
  CANDIDATE=""
  for AC in "${AREA_CODES[@]}"; do
    CANDIDATE=$(aws connect search-available-phone-numbers --target-arn "$INSTANCE_ARN" \
      --phone-number-country-code US --phone-number-type DID --phone-number-prefix "+1$AC" --max-results 1 \
      --query 'AvailableNumbersList[0].PhoneNumber' --output text 2>/dev/null || true)
    none "$CANDIDATE" || break
    CANDIDATE=""
  done
  [ -n "$CANDIDATE" ] || die "No Phoenix-area numbers available right now. Try again later, or claim one in the Connect console."
  say ""
  read -r -p "Claim ${B}$CANDIDATE${X}? It costs about \$0.90/month plus ~2¢ per minute of calls. [y/N] " yn
  case "$yn" in [yY]*) ;; *) die "Stopped before claiming a number. Nothing that costs money was set up." ;; esac
  NUMBER_ID=$(aws connect claim-phone-number --target-arn "$INSTANCE_ARN" --phone-number "$CANDIDATE" \
    --phone-number-description "Gains Support Line" --query PhoneNumberId --output text) ||
    die "Couldn't claim the number. Brand-new AWS accounts sometimes need a support case to unlock phone numbers."
  NUMBER="$CANDIDATE"
  for _ in $(seq 1 24); do
    S=$(aws connect describe-phone-number --phone-number-id "$NUMBER_ID" \
      --query ClaimedPhoneNumberSummary.PhoneNumberStatus.Status --output text)
    [ "$S" = CLAIMED ] && break
    [ "$S" = FAILED ] && die "Claiming the number failed. Try again, or claim one in the Connect console."
    sleep 5
  done
fi
ok "Number: $NUMBER"

# ---------------------------------------------------------------- 4. Point the number at the flow
aws connect associate-phone-number-contact-flow --phone-number-id "$NUMBER_ID" \
  --instance-id "$INSTANCE_ID" --contact-flow-id "$FLOW_ID"
ok "Calls to $NUMBER now go to '$FLOW_NAME'"

# ---------------------------------------------------------------- 5. Budget alert (whole AWS account)
if ! aws budgets describe-budget --account-id "$ACCOUNT" --budget-name gains-phone >/dev/null 2>&1; then
  say ""
  read -r -p "Email for a \$$BUDGET_USD/month AWS budget alert (blank to skip): " EMAIL
  if [ -n "$EMAIL" ]; then
    SUB="[{\"SubscriptionType\":\"EMAIL\",\"Address\":\"$EMAIL\"}]"
    aws budgets create-budget --account-id "$ACCOUNT" \
      --budget "{\"BudgetName\":\"gains-phone\",\"BudgetLimit\":{\"Amount\":\"$BUDGET_USD\",\"Unit\":\"USD\"},\"TimeUnit\":\"MONTHLY\",\"BudgetType\":\"COST\"}" \
      --notifications-with-subscribers "[
        {\"Notification\":{\"NotificationType\":\"ACTUAL\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":50,\"ThresholdType\":\"PERCENTAGE\"},\"Subscribers\":$SUB},
        {\"Notification\":{\"NotificationType\":\"ACTUAL\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":100,\"ThresholdType\":\"PERCENTAGE\"},\"Subscribers\":$SUB},
        {\"Notification\":{\"NotificationType\":\"FORECASTED\",\"ComparisonOperator\":\"GREATER_THAN\",\"Threshold\":100,\"ThresholdType\":\"PERCENTAGE\"},\"Subscribers\":$SUB}]"
    ok "Budget alert: emails at 50% and 100% of \$$BUDGET_USD, and if a month is forecast to pass it"
  fi
else
  ok "Budget alert already set"
fi

# ---------------------------------------------------------------- done
PRETTY=$(printf '%s' "$NUMBER" | sed -E 's/^\+1([0-9]{3})([0-9]{3})([0-9]{4})$/(\1) \2-\3/')
say ""
say "${G}${B}The Gains Support Line is live: $PRETTY${X}"
say "Call it. Updating the voice lines later: edit phone/build_flow.py, rebuild, rerun this script."
