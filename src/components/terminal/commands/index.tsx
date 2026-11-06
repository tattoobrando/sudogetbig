"use client";

import type { ReactNode } from "react";
import type { Command } from "../engine";
import { B, C, G, M, Pre, Rows, Y } from "../Out";
import { gainsCommands } from "./gains";
import { devCommands } from "./dev";
import { systemCommands } from "./system";
import { eggCommands } from "./eggs";

const GROUPS: { id: Command["group"]; title: string }[] = [
  { id: "gains", title: "GAINS" },
  { id: "dev", title: "DEV TOOLS" },
  { id: "system", title: "SYSTEM" },
  { id: "files", title: "FILES & SHELL" },
  { id: "misc", title: "MISC" },
];

const help: Command = {
  match: ["help"],
  aliases: [["--help"], ["-h"], ["?"], ["commands"]],
  usage: "help",
  summary: "this screen",
  group: "misc",
  run(ctx) {
    const visible = COMMANDS.filter((c) => !c.hidden);
    const hidden = COMMANDS.filter((c) => c.hidden).length;
    ctx.print(
      <span>
        <B>SwoleOS shell</B> <M>— commands that are installed, documented, and mostly functional.</M>
      </span>,
    );
    for (const g of GROUPS) {
      const rows = visible.filter((c) => c.group === g.id).map((c) => [<G key="u">{c.usage}</G>, c.summary] as [ReactNode, ReactNode]);
      if (!rows.length) continue;
      ctx.print(<C className="mt-2 block font-bold tracking-wider">{g.title}</C>);
      ctx.print(<Rows rows={rows} pad={34} />);
    }
    ctx.print(
      <M className="mt-2 block">
        Tab autocompletes · ↑/↓ history · Ctrl+C aborts · Ctrl+L clears ·{" "}
        <Y>{hidden} undocumented commands exist.</Y> Find them.
      </M>,
    );
  },
};

const clear: Command = {
  match: ["clear"],
  aliases: [["cls"], ["reset"]],
  usage: "clear",
  summary: "clear the screen",
  group: "files",
  run(ctx) {
    ctx.clear();
  },
};

const MAN_GAINS = `GAINS(1)                    SwoleOS Manual                    GAINS(1)

NAME
       gains - grant root access to your physique

SYNOPSIS
       sudo get big [--now] [--dirty] [--no-legs]
       sudo apt install <muscle>...

DESCRIPTION
       gains escalates your physique from limited user privileges to
       MASSIVE. It does this by running progressive overload in a loop
       until something gives. Ideally the muscle.

OPTIONS
       --now      Skip confirmation. Also skips warm-up (not recommended).
       --dirty    Enable dirty bulk. Disables all safety protocols.
       --no-legs  Default behavior. Flag kept for backwards compatibility.
       --natty    Accepted. Cannot be verified.

EXIT STATUS
       0      Gains installed.
       1      General failure (skipped breakfast).
       2      Misuse of equipment (curls in the squat rack).
       137    Killed by OOM (ate the whole buffet).

BUGS
       Calves are not supported on this architecture.
       leg_day.service fails to start on most systems.
       Running 'sudo get big' twice does not make you twice as big.

SEE ALSO
       squat(8), sleep(1), eat(1), touch(1) (not grass)

SwoleOS 24.04                 November 2026                    GAINS(1)`;

const man: Command = {
  match: ["man"],
  usage: "man gains",
  summary: "read the manual (first time for everything)",
  group: "misc",
  complete: () => ["gains", "squat", "sleep", "sudo"],
  run(ctx) {
    const page = (ctx.args[0] ?? "").toLowerCase();
    if (!page) {
      ctx.print(<span>What manual page do you want? <M>For example, try &apos;man gains&apos;.</M></span>);
      return;
    }
    if (page === "gains" || page === "sudogetbig") {
      ctx.print(<Pre className="text-text">{MAN_GAINS}</Pre>);
      return;
    }
    if (page === "squat") {
      ctx.print(<Pre>{"SQUAT(8)\n\nNAME\n       squat - lower the system, then raise it\n\nDESCRIPTION\n       You have never opened this page. We can tell."}</Pre>);
      return;
    }
    if (page === "sleep") {
      ctx.print(<Pre>{"SLEEP(1)\n\nNAME\n       sleep - delay for a specified amount of time\n\nSYNOPSIS\n       sleep 8h\n\nNOTES\n       Values above 5h12m are rarely observed in the wild."}</Pre>);
      return;
    }
    ctx.print(<span>No manual entry for {page}. Have you tried the comments under a lifting video?</span>);
  },
};

export const COMMANDS: Command[] = [
  help,
  ...gainsCommands,
  ...devCommands,
  ...systemCommands,
  clear,
  man,
  ...eggCommands,
];

export const SUGGESTIONS = [
  "sudo get big",
  "neofetch",
  "sudo apt install calves",
  "top",
  'git commit -m "added 5lbs of muscle"',
  "sudo systemctl stop leg_day",
  "ping gains",
  "sudo rm -rf /bellyfat",
  "touch grass",
  "help",
];
