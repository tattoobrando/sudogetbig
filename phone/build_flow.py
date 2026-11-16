#!/usr/bin/env python3
"""
Builds flow.json: the Amazon Connect contact flow for the Gains Support Line.

    python3 phone/build_flow.py        (writes phone/flow.json and checks it)

Every voice line lives in this file. Edit a line, rebuild, then rerun
phone/setup.sh in AWS CloudShell; it updates the live flow in place.

Every path ends in a hang-up: the main menu can be visited at most 6 times,
so nobody can park on the line and run up the bill.
"""
import json
import uuid
from pathlib import Path

NS = uuid.UUID("5a1e0000-0000-4000-8000-000000000042")
SITE = '<sub alias="sue doo get big dot com">sudogetbig.com</sub>'
MAX_MENU_VISITS = 6

actions = []


def aid(name: str) -> str:
    """Stable id per block name, so rebuilding doesn't reshuffle everything."""
    return str(uuid.uuid5(NS, name))


def ssml(body: str) -> str:
    return f"<speak>{body}</speak>"


def say(name, text, next_):
    actions.append({
        "Identifier": aid(name), "Type": "MessageParticipant",
        "Parameters": {"SSML": ssml(text)},
        "Transitions": {"NextAction": aid(next_), "Errors": [{"NextAction": aid(next_), "ErrorType": "NoMatchingError"}]},
    })


def random3(name, a, b, c):
    """Distribute by percentage: about a third of callers each way."""
    actions.append({
        "Identifier": aid(name), "Type": "DistributeByPercentage", "Parameters": {},
        "Transitions": {
            "NextAction": aid(c),
            "Conditions": [
                {"NextAction": aid(a), "Condition": {"Operator": "NumberLessThan", "Operands": ["34"]}},
                {"NextAction": aid(b), "Condition": {"Operator": "NumberLessThan", "Operands": ["67"]}},
            ],
            "Errors": [{"NextAction": aid(c), "ErrorType": "NoMatchingCondition"}],
        },
    })


# ---------------------------------------------------------------- start
actions.append({
    "Identifier": aid("voice"), "Type": "UpdateContactTextToSpeechVoice",
    "Parameters": {"TextToSpeechVoice": "Matthew", "TextToSpeechEngine": "Neural"},
    "Transitions": {"NextAction": aid("greeting")},
})
say("greeting",
    f"Thank you for calling the Gains Support Line, a service of {SITE}. <break time='400ms'/>"
    "Your call is important to us. <break time='350ms'/> More important than cardio. <break time='300ms'/> Less important than protein.",
    "menu-loop")

# ---------------------------------------------------------------- main menu (bounded loop)
actions.append({
    "Identifier": aid("menu-loop"), "Type": "Loop", "Parameters": {"LoopCount": str(MAX_MENU_VISITS)},
    "Transitions": {
        "NextAction": aid("goodbye"),
        "Conditions": [
            {"NextAction": aid("menu"), "Condition": {"Operator": "Equals", "Operands": ["ContinueLooping"]}},
            {"NextAction": aid("goodbye"), "Condition": {"Operator": "Equals", "Operands": ["DoneLooping"]}},
        ],
    },
})
MENU = (
    "For leg day excuses, press 1. <break time='250ms'/>"
    "To report a new personal record, press 2. <break time='250ms'/>"
    "For motivation, press 3. <break time='250ms'/>"
    "For expert gym advice, press 4. <break time='250ms'/>"
    "For root's training stats, press 5. <break time='250ms'/>"
    "To speak with a spotter, press 0. <break time='250ms'/>"
    "To hear these options again, press 9. <break time='400ms'/>"
    "Or just breathe heavily, like you do between sets."
)
choices = {"1": "excuse", "2": "pr-ask", "3": "motivate", "4": "advice-intro", "5": "stats", "0": "spotter", "7": "secret", "9": "menu-loop"}
actions.append({
    "Identifier": aid("menu"), "Type": "GetParticipantInput",
    "Parameters": {"StoreInput": "False", "InputTimeLimitSeconds": "8", "SSML": ssml(MENU)},
    "Transitions": {
        "NextAction": aid("menu-invalid"),
        "Conditions": [{"NextAction": aid(t), "Condition": {"Operator": "Equals", "Operands": [k]}} for k, t in choices.items()],
        "Errors": [
            {"NextAction": aid("menu-timeout"), "ErrorType": "InputTimeLimitExceeded"},
            {"NextAction": aid("menu-invalid"), "ErrorType": "NoMatchingCondition"},
            {"NextAction": aid("menu-invalid"), "ErrorType": "NoMatchingError"},
        ],
    },
})
say("menu-timeout", "Still there? <break time='300ms'/> Take your time. Rest periods are important.", "menu-loop")
say("menu-invalid", "That is not an option. <break time='300ms'/> Neither is skipping leg day. <break time='400ms'/> Allegedly.", "menu-loop")

# ---------------------------------------------------------------- 1: leg day excuses
random3("excuse", "excuse-a", "excuse-b", "excuse-c")
say("excuse-a", "Today's approved leg day excuse: <break time='300ms'/> you have a big meeting tomorrow, and you'll need your legs to walk into it.", "excuse-end")
say("excuse-b", "Today's approved leg day excuse: <break time='300ms'/> your legs are already genetically gifted. You don't want to make the other legs jealous.", "excuse-end")
say("excuse-c", "Today's approved leg day excuse: <break time='300ms'/> someone is doing curls in the squat rack, and you are not one to make a scene.", "excuse-end")
say("excuse-end", "<break time='300ms'/> This excuse is valid for twenty four hours. Returning to the main menu.", "menu-loop")

# ---------------------------------------------------------------- 2: report a PR
actions.append({
    "Identifier": aid("pr-ask"), "Type": "GetParticipantInput",
    "Parameters": {
        "StoreInput": "True",
        "InputTimeLimitSeconds": "10",
        "SSML": ssml("Please enter your new personal record in pounds, then press pound. <break time='300ms'/> Yes, the pound key. We know."),
        "InputValidation": {"CustomValidation": {"MaximumLength": "4"}},
        "DTMFConfiguration": {"InputTerminationSequence": "#", "DisableCancelKey": "False"},
    },
    "Transitions": {"NextAction": aid("pr-check"), "Errors": [{"NextAction": aid("pr-none"), "ErrorType": "NoMatchingError"}]},
})
actions.append({
    "Identifier": aid("pr-check"), "Type": "Compare", "Parameters": {"ComparisonValue": "$.StoredCustomerInput"},
    "Transitions": {
        "NextAction": aid("pr-none"),
        "Conditions": [
            {"NextAction": aid("pr-forklift"), "Condition": {"Operator": "NumberGreaterOrEqualTo", "Operands": ["1000"]}},
            {"NextAction": aid("pr-video"), "Condition": {"Operator": "NumberGreaterOrEqualTo", "Operands": ["405"]}},
            {"NextAction": aid("pr-solid"), "Condition": {"Operator": "NumberGreaterOrEqualTo", "Operands": ["225"]}},
            {"NextAction": aid("pr-small"), "Condition": {"Operator": "NumberGreaterOrEqualTo", "Operands": ["1"]}},
        ],
        "Errors": [{"NextAction": aid("pr-none"), "ErrorType": "NoMatchingCondition"}],
    },
})
LBS = "<say-as interpret-as='cardinal'>$.StoredCustomerInput</say-as> pounds."
say("pr-forklift", f"{LBS} <break time='400ms'/> That is not a personal record. That is a forklift. <break time='300ms'/> Please return it to the warehouse.", "pr-end")
say("pr-video", f"{LBS} <break time='400ms'/> Okay. We're going to need to see the video. Raw. Unedited. Plates visible.", "pr-end")
say("pr-solid", f"{LBS} <break time='400ms'/> Respectable. Your record has been logged in a database that definitely exists.", "pr-end")
say("pr-small", f"{LBS} <break time='400ms'/> Every record counts. <break time='300ms'/> This one counts too. Barely. We're proud of you anyway.", "pr-end")
say("pr-none", "We didn't catch a number. <break time='300ms'/> That's fine. We'll call it a rest day.", "pr-end")
say("pr-end", "<break time='300ms'/> Returning to the main menu.", "menu-loop")

# ---------------------------------------------------------------- 3: motivation
random3("motivate", "motivate-a", "motivate-b", "motivate-c")
say("motivate-a", "Remember: <break time='300ms'/> the weight doesn't care how you feel. <break time='400ms'/> Neither do we. Go lift.", "menu-loop")
say("motivate-b", "Every rep you skip is a rep someone else is doing. <break time='400ms'/> Probably with worse form. But still.", "menu-loop")
say("motivate-c", "You are one workout away from a good mood. <break time='400ms'/> And one leg day away from a bad one.", "menu-loop")

# ---------------------------------------------------------------- 4: expert advice
say("advice-intro", "The following is not medical advice. <break time='300ms'/> Or advice.", "advice")
random3("advice", "advice-a", "advice-b", "advice-c")
say("advice-a", "If it doesn't hurt, add weight. <break time='300ms'/> If it does hurt, call a doctor. Not this number.", "menu-loop")
say("advice-b", "Protein is a personality trait now. <break time='300ms'/> Act accordingly.", "menu-loop")
say("advice-c", "The gym mirror adds ten pounds of muscle. The lighting adds five more. <break time='300ms'/> Check your progress in a gas station bathroom to stay humble.", "menu-loop")

# ---------------------------------------------------------------- 5: stats
say("stats",
    "Root's training log, as of the last update: <break time='300ms'/> more than eighteen months of logged workouts, "
    "and not a single missed week since early twenty twenty five. <break time='400ms'/>"
    "Leg training has fallen to about four percent of total sets. <break time='300ms'/> An investigation is ongoing. <break time='400ms'/>"
    f"For live charts, visit {SITE} slash lifts.",
    "menu-loop")

# ---------------------------------------------------------------- 7: unlisted
say("secret",
    "You found the secret menu. <break time='300ms'/> Connecting you to the calves department. <break time='1500ms'/>"
    "We're sorry. <break time='200ms'/> The calves you are trying to reach do not exist. <break time='300ms'/> Please check the genetics and try again.",
    "menu-loop")

# ---------------------------------------------------------------- 0: spotter (fake hold, then hang up)
say("spotter", "Please hold while we connect you to the next available spotter.", "hold-1")
say("hold-1", "<break time='3s'/> All spotters are currently filming themselves. Please continue to hold.", "hold-2")
say("hold-2", "<break time='3s'/> Your estimated wait time is: <break time='300ms'/> one more set.", "hold-3")
say("hold-3", "<break time='3s'/> Good news. A spotter has been located. <break time='500ms'/> They are on their phone.", "hold-4")
say("hold-4", "<break time='1500ms'/> They did not look up. <break time='300ms'/> Please try again after your next set. Goodbye.", "hangup")

# ---------------------------------------------------------------- end
say("goodbye",
    "That's the whole menu. <break time='300ms'/> That's more cardio than most callers get. <break time='400ms'/>"
    "Thanks for calling the Gains Support Line. <break time='300ms'/> Go hit legs.",
    "hangup")
actions.append({"Identifier": aid("hangup"), "Type": "DisconnectParticipant", "Parameters": {}, "Transitions": {}})


# ---------------------------------------------------------------- checks + layout
def targets(a):
    t = a["Transitions"]
    out = [t["NextAction"]] if t.get("NextAction") else []
    out += [c["NextAction"] for c in t.get("Conditions", [])]
    out += [e["NextAction"] for e in t.get("Errors", [])]
    return out


ids = {a["Identifier"] for a in actions}
assert len(ids) == len(actions), "duplicate block"
for a in actions:
    for t in targets(a):
        assert t in ids, f"{a['Identifier']} points at a missing block"
start = aid("voice")
seen, stack = set(), [start]
while stack:
    x = stack.pop()
    if x in seen:
        continue
    seen.add(x)
    stack += targets(next(a for a in actions if a["Identifier"] == x))
assert seen == ids, "unreachable blocks"
for a in actions:
    p = a["Parameters"]
    if "SSML" in p:
        assert p["SSML"].count("<speak>") == 1 and len(p["SSML"]) < 3000
assert len(actions) <= 250

meta = {"EntryPointPosition": {"x": 40, "y": 40}, "ActionMetadata": {}}
for i, a in enumerate(actions):
    meta["ActionMetadata"][a["Identifier"]] = {"position": {"x": 240 + (i % 6) * 260, "y": 40 + (i // 6) * 220}}

flow = {"Version": "2019-10-30", "StartAction": start, "Metadata": meta, "Actions": actions}
out = Path(__file__).with_name("flow.json")
out.write_text(json.dumps(flow, indent=2) + "\n")
print(f"wrote {out.name}: {len(actions)} blocks, all reachable, every path ends in a hang-up")
