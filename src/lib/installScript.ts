/*
  Served at sudogetbig.com/install for:  curl -sL sudogetbig.com/install | bash

  It is deliberately harmless: it only prints text (printf/sleep), never writes
  files, never touches the network, never asks for sudo. The punchline is that
  you ran it anyway.
*/
// String.raw keeps bash escapes intact; "\${" is how we write a literal "${" inside it.
export const INSTALL_SCRIPT = String.raw`#!/usr/bin/env bash
# sudogetbig installer — https://sudogetbig.com
#
# Good news: this script only prints text. It does not write files, change
# settings, use the network, or ask for your password. You can read every line.
# Bad news: you probably didn't, and that's the point.

if [ -t 1 ] && [ -z "\${NO_COLOR:-}" ]; then
  G=$'\033[38;5;48m'; GB=$'\033[1;38;5;48m'; Y=$'\033[38;5;214m'; R=$'\033[38;5;203m'
  C=$'\033[38;5;81m'; M=$'\033[38;5;246m'; B=$'\033[1m'; X=$'\033[0m'; FAST=0
else
  G=''; GB=''; Y=''; R=''; C=''; M=''; B=''; X=''; FAST=1
fi

nap() { [ "$FAST" = 1 ] || sleep "$1" 2>/dev/null || true; }
say() { printf '%s\n' "$*"; }

step() {
  local label="$1" t="\${2:-0.6}" frames='|/-\' i=0 n
  if [ "$FAST" = 1 ]; then say "$G✓$X $label"; return; fi
  n=$(awk "BEGIN{print int($t/0.08)}" 2>/dev/null || echo 7)
  while [ "$i" -lt "$n" ]; do
    printf '\r%s%s%s %s' "$C" "\${frames:i%4:1}" "$X" "$label"
    nap 0.08; i=$((i+1))
  done
  printf '\r%s✓%s %s\033[K\n' "$G" "$X" "$label"
}

progress() {
  local label="$1" p=0 w=28 f
  [ "$FAST" = 1 ] && p=100
  while :; do
    f=$((p*w/100))
    printf '\r%-22s %s[%s%s%s%s]%s %3d%%' "$label" "$M" "$G" "$(printf '%*s' "$f" '' | tr ' ' '#')" "$M" "$(printf '%*s' "$((w-f))" '' | tr ' ' '.')" "$X" "$p"
    [ "$p" -ge 100 ] && break
    nap 0.04
    p=$((p + 3 + RANDOM % 7)); [ "$p" -gt 100 ] && p=100
  done
  printf '\n'
}

USER_NAME="\${USER:-\${USERNAME:-gains}}"

say ""
say "$GB  \$ sudo get big$X"
nap 0.4
printf '%s' "[sudo] password for $USER_NAME: "
for _ in 1 2 3 4 5 6 7 8; do printf '*'; nap 0.07; done
say ""
say "$M  (relax. nothing was typed, read, or stored.)$X"
nap 0.4
say "Reading package lists... Done"
say "Building dependency tree... Done"
nap 0.2
step "Detecting hardware: 1 human (unoptimized)" 0.7
step "Checking protein levels: insufficient" 0.6
step "Locating calves" 0.9
say "$R  E: Unable to locate package calves$X"
say "$M  ERROR 404: Genetics not found. Package unavailable for this architecture.$X"
nap 0.3
progress "Downloading creatine"
progress "Compiling chest_day"
progress "Linking mind_muscle"
step "Mounting /dev/delts" 0.6
step "Disabling excuses.service" 0.7
say "$Y  WARNING:$X leg_day.service has not been started."

if [ "$FAST" = 0 ] && [ -r /dev/tty ]; then
  printf '%s' "Start leg_day.service now? [Y/n] "
  if read -r -t 15 ANSWER < /dev/tty 2>/dev/null; then :; else ANSWER=""; say ""; fi
  case "$ANSWER" in
    [nN]*) say "$M  Correct choice, statistically.$X" ;;
    *)     step "Starting leg_day.service" 1.2
           say "$R  Job for leg_day.service failed: remembered something urgent at home.$X" ;;
  esac
fi

nap 0.3
JACKED="0.00$((RANDOM % 7 + 1))"
say ""
say "$G  ╭──────────────────────────────────────────╮$X"
say "$G  │$X$GB  STATUS: MASSIVE PRIVILEGES GRANTED      $X$G│$X"
say "$G  ╰──────────────────────────────────────────╯$X"
say "  Congratulations, $USER_NAME. You are now $B$JACKED%$X more jacked."
say ""
nap 0.6
say "$Y  P.S.$X You just piped a script from the internet straight into bash"
say "  without reading it. Your security posture is weaker than your calves."
say "  This one only printed text. The next one might not."
say ""
say "$M  Read this script:  curl -sL sudogetbig.com/install"
say "  Rate your GitHub:  curl sudogetbig.com/github/<you>"
say "  Full terminal:     https://sudogetbig.com$X"
say ""
`.replaceAll("\\${", "${");
