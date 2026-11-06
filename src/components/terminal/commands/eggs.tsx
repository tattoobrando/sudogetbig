"use client";

import type { Command } from "../engine";
import { B, G, M, Ok, Pre, R, Y } from "../Out";
import { lines, progress, steps } from "./helpers";
import { hex, intBetween } from "@/lib/random";

/* Undocumented. Not in `help`. Not in tab completion. Findable. */

const vim: Command = {
  match: ["vim"],
  aliases: [["vi"], ["nvim"], ["nano"], ["emacs"]],
  usage: "vim",
  summary: "",
  group: "misc",
  hidden: true,
  run(ctx) {
    const which = ctx.raw.trim().split(/\s+/)[ctx.sudo ? 1 : 0];
    if (which === "nano") {
      ctx.print(<M>nano: too small. Try &apos;sudo apt install nano-bulk&apos;. Or embrace vim.</M>);
      return;
    }
    if (which === "emacs") {
      ctx.print(<M>emacs: great operating system, lacking only a decent squat rack.</M>);
      return;
    }
    ctx.print(
      <Pre className="text-muted">
        {"~\n~              VIM - Vi IMproved (Iron edition)\n~\n~           type  :q<Enter>     to exit\n~           type  :q!<Enter>    to exit (more aggressively)\n~           type  anything else to discover regret\n~"}
      </Pre>,
    );
    let tries = 0;
    ctx.setTrap((line) => {
      const l = line.trim();
      if ([":q", ":q!", ":wq", ":wq!", ":x", "zz", "ZZ"].includes(l)) {
        ctx.setTrap(null);
        ctx.unlock("vim");
        ctx.print(l.startsWith(":w") ? <Ok>&quot;gains.txt&quot; written. 0 bytes. (No gains were saved.)</Ok> : <Ok>You escaped vim. Put that on your résumé.</Ok>);
        return true;
      }
      tries++;
      if (tries === 1) ctx.print(<R>E37: No write since last rep (add ! to override)</R>);
      else if (tries === 2) ctx.print(<R>E492: Not an editor command: {l || "<Enter>"}. Did you mean to leave?</R>);
      else if (tries === 3) ctx.print(<Y>Thousands of developers are trapped here. Some have been here since 2009.</Y>);
      else ctx.print(<M>hint: type <G>:q!</G> and press Enter. we believe in you.</M>);
      return true;
    }, ":");
  },
};

const sl: Command = {
  match: ["sl"],
  usage: "sl",
  summary: "",
  group: "misc",
  hidden: true,
  async run(ctx) {
    ctx.unlock("sl");
    const art = [
      "     __                              __     ",
      " ___|  |____________________________|  |___ ",
      "|___|  |____________________________|  |___|",
      "    |__|                            |__|    ",
    ];
    const width = 64;
    const h = ctx.print(<Pre className="text-accent">{art.join("\n")}</Pre>);
    for (let x = width; x >= -art[0].length; x -= 3) {
      await ctx.sleep(40);
      const frame = art
        .map((row) => {
          if (x >= 0) return " ".repeat(x) + row;
          return row.slice(-x);
        })
        .join("\n");
      h.update(<Pre className="text-accent">{frame}</Pre>);
    }
    h.update(<M>a 20kg barbell just rolled past. you typed &apos;sl&apos; instead of &apos;ls&apos;. it happens to everyone.</M>);
  },
};

const hack: Command = {
  match: ["hack"],
  aliases: [["hack", "the", "gym"], ["hack", "gym"], ["hackerman"]],
  usage: "hack",
  summary: "",
  group: "misc",
  hidden: true,
  async run(ctx) {
    ctx.unlock("hack");
    await lines(
      ctx,
      [
        <G key="1">[*] Target acquired: gym.local (front desk, badge reader, vending machine)</G>,
        <span key="2">[*] Enumerating open ports… 22/ssh 80/http 1337/protein-bar-dispenser</span>,
      ],
      300,
    );
    await steps(ctx, [
      "Bypassing front desk with confident walking",
      "Brute-forcing locker 117 (combination: 1-2-3)",
      "Escalating privileges via 'my friend works here'",
      "Exfiltrating towels",
    ]);
    await progress(ctx, "Decrypting squat rack schedule", { tone: "amber", step: [6, 15] });
    ctx.print(<Pre className="text-accent">{`0x${hex(8)}  ACCESS GRANTED`}</Pre>);
    ctx.print(<B>Loot: 1 free towel, 2 protein bars (expired 2023), and the wifi password (&quot;getbig2019&quot;).</B>);
    ctx.print(<M>This hack did nothing. Neither does your forearm routine.</M>);
  },
};

const su: Command = {
  match: ["su"],
  aliases: [["-i"], ["-s"]],
  usage: "su",
  summary: "",
  group: "misc",
  hidden: true,
  async run(ctx) {
    if (ctx.isRoot) {
      ctx.print(<M>you are already root. there is no higher. except bigger. (sudo get bigger)</M>);
      return;
    }
    if (!ctx.sudo && ctx.raw.trim() === "su") {
      await ctx.ask("Password: ");
      await ctx.sleep(800);
      ctx.print(<R>su: Authentication failure</R>);
      ctx.print(<M>hint: the password is not &quot;password&quot;. try sudo.</M>);
      return;
    }
    ctx.unlock("root");
    ctx.setRoot(true);
    ctx.print(<Y className="font-bold">You are now root.</Y>);
    ctx.print(<M>Every command runs with full privileges. Calves still unavailable. Type &apos;exit&apos; to give it up.</M>);
  },
};

const shake: Command = {
  match: ["make", "me", "a", "protein", "shake"],
  aliases: [["make", "me", "a", "shake"], ["make", "me", "a", "sandwich"]],
  usage: "make me a protein shake",
  summary: "",
  group: "misc",
  hidden: true,
  async run(ctx) {
    const sandwich = ctx.raw.includes("sandwich");
    if (!ctx.sudo && !ctx.isRoot) {
      ctx.print(<span>What? Make it yourself.</span>);
      return;
    }
    ctx.unlock("shake");
    ctx.print(<span>Okay.</span>);
    await steps(ctx, sandwich
      ? ["Toasting bread", "Adding 200g chicken", "Removing bread (carbs, apparently)"]
      : ["Adding 2 scoops whey (vanilla, regrettably)", "Adding milk", "Adding peanut butter (too much)", "Blending at 22,000 RPM"]);
    ctx.print(<Ok>{sandwich ? "Here's your sandwich. It's a chicken breast." : `Shake ready. ${intBetween(48, 62)}g protein. It's lumpy. Drink it anyway.`}</Ok>);
  },
};

const iddqd: Command = {
  match: ["iddqd"],
  aliases: [["idkfa"], ["godmode"]],
  usage: "iddqd",
  summary: "",
  group: "misc",
  hidden: true,
  run(ctx) {
    ctx.unlock("iddqd");
    ctx.godMode();
    ctx.print(<Y className="font-bold glow">GOD MODE ENABLED</Y>);
    ctx.print(<M>Invulnerable for 15 seconds. Recovery, however, is still a mortal process.</M>);
  },
};

const fortyTwo: Command = {
  match: ["42"],
  aliases: [["xyzzy"]],
  usage: "42",
  summary: "",
  group: "misc",
  hidden: true,
  run(ctx) {
    ctx.print(<M>{ctx.raw.trim() === "42" ? "Correct. Now what was the question? (It was 'how many sets of curls is too many'.)" : "Nothing happens. Unlike your shoulders, which are visibly happening."}</M>);
  },
};

export const eggCommands: Command[] = [vim, sl, hack, su, shake, iddqd, fortyTwo];
