# Gains Support Line

A real phone number for sudogetbig.com, run on Amazon Connect. Callers get:

| Key | What happens |
|---|---|
| 1 | A random approved leg day excuse |
| 2 | Enter your PR in pounds; it gets judged (under 225, 225+, 405+, 1000+) |
| 3 | Random motivation |
| 4 | Random "expert advice" (not medical advice, or advice) |
| 5 | Root's training stats |
| 0 | "Speak to a spotter": a fake hold, then the spotter never looks up |
| 7 | Unlisted: the calves department (it doesn't exist) |
| 9 | Repeat the menu |

The menu can be visited at most 6 times and the spotter hold ends in a hang-up,
so every call ends on its own (a few minutes at most).

## Files

- `build_flow.py`: every voice line and the menu logic. `python3 build_flow.py` writes `flow.json` and checks every block is reachable and every path hangs up.
- `flow.json`: the Amazon Connect flow (generated; don't edit by hand).
- `setup.sh`: run in AWS CloudShell. Creates the Connect instance, uploads the flow, claims a Phoenix number (asks first), connects them, and sets a $25/month budget alert. Rerun it any time to push flow changes.

## Set up

In the AWS console, switch the region to **US West (Oregon)**, open **CloudShell** (the `>_` icon), then:

```bash
git clone https://github.com/tattoobrando/sudogetbig.git
cd sudogetbig/phone && bash setup.sh
```

## Change what it says

Edit `build_flow.py`, run `python3 phone/build_flow.py`, commit and push, then in CloudShell:

```bash
cd ~/sudogetbig && git pull && cd phone && bash setup.sh
```

## Cost

About $0.90/month for the number plus roughly 2–4¢ per minute of calls.
