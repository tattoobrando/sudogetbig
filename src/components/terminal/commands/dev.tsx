"use client";

import type { Command } from "../engine";
import { B, C, G, M, Ok, Pre, R, Y } from "../Out";
import { lines, progress } from "./helpers";
import { hex, intBetween } from "@/lib/random";

const git: Command = {
  match: ["git"],
  usage: 'git commit -m "<msg>"',
  summary: "commit your progress (good luck)",
  group: "dev",
  complete: (args) =>
    args.length === 0 ? ["commit", "log", "push", "status", "blame", "pull", "checkout"] : args[0] === "commit" ? ["-m"] : args[0] === "blame" ? ["legs"] : [],
  async run(ctx) {
    const [sub, ...rest] = ctx.args;
    switch (sub) {
      case "commit": {
        const mi = rest.findIndex((a) => a === "-m" || a === "-am");
        const msg = mi >= 0 ? rest[mi + 1] : undefined;
        if (!msg) {
          ctx.print(<span>error: switch `m&apos; requires a value</span>);
          ctx.print(<M>usage: git commit -m &quot;added 5lbs of muscle&quot;</M>);
          return;
        }
        ctx.print(<M>Running pre-commit hooks…</M>);
        await ctx.sleep(450);
        ctx.print(<span><C>mirror-check</C>.......................................................<R>Failed</R></span>);
        ctx.print(<span><C>scale-delta</C>........................................................<R>Failed</R></span>);
        ctx.print(<span><C>sleeve-tightness</C>...................................................<Y>Skipped</Y></span>);
        await ctx.sleep(250);
        ctx.print(<R>Commit rejected. No measurable changes detected.</R>);
        ctx.print(<M>  &quot;{msg}&quot; — claim could not be reproduced under gym lighting.</M>);
        ctx.print(<M>  scale delta: +0.0 kg (water weight does not count)</M>);
        ctx.print(<M>hint: try again in 6-8 weeks.</M>);
        ctx.reject();
        return;
      }
      case "log":
        ctx.print(
          <Pre>
            <Y>commit {hex(7)}</Y> <C>(HEAD -&gt; bulk-season)</C>{"\n"}
            Author: gains &lt;gains@sudogetbig.com&gt;{"\n"}
            {"    "}feat(chest): bench 100kg for a single, no spotter touch (disputed){"\n\n"}
            <Y>commit {hex(7)}</Y>{"\n"}
            {"    "}fix(back): stop ego-rowing with your lower back{"\n\n"}
            <Y>commit c0ffee1</Y>{"\n"}
            {"    "}chore: bought new shaker, lost old shaker in car{"\n\n"}
            <Y>commit 1e9da70</Y> <C>(tag: v0.1-legday)</C>{"\n"}
            {"    "}Revert &quot;leg day&quot;{"\n\n"}
            <Y>commit d4db0d2</Y>{"\n"}
            {"    "}Initial commit: Dad Bod v2.1
          </Pre>,
        );
        return;
      case "push":
        if (rest.includes("--force") || rest.includes("-f")) {
          ctx.print(<span>+ {hex(7)}...{hex(7)} bulk-season -&gt; main (forced update)</span>);
          await ctx.sleep(400);
          ctx.print(<R>error: lower back has been force-pushed. Rolling back to v0.1. Ice recommended.</R>);
          ctx.reject();
          return;
        }
        ctx.print(<span>To gym.local:iron/physique.git</span>);
        ctx.print(<R> ! [rejected]        bulk-season -&gt; main (fetch first)</R>);
        ctx.print(<R>error: failed to push some refs to &apos;gym.local:iron/physique.git&apos;</R>);
        ctx.print(<Y>hint: Updates were rejected because the remote contains gains you do not have.</Y>);
        ctx.print(<Y>hint: Your gym partner pushed a heavier bench. Pull, then try again.</Y>);
        ctx.reject();
        return;
      case "pull":
        ctx.print(<span>From gym.local:iron/physique</span>);
        ctx.print(<span> * branch            main       -&gt; FETCH_HEAD</span>);
        ctx.print(<R>CONFLICT (content): Merge conflict in diet.txt</R>);
        ctx.print(<Pre className="text-muted">{"<<<<<<< HEAD\npizza\n=======\nchicken, rice, broccoli\n>>>>>>> origin/main"}</Pre>);
        ctx.print(<M>Automatic merge failed; fix conflicts by eating the chicken.</M>);
        return;
      case "status":
        ctx.print(<span>On branch <G>bulk-season</G></span>);
        ctx.print(<span>Your branch is behind &apos;origin/swole&apos; by <B>47 workouts</B>.</span>);
        ctx.print(<span>Changes not staged for commit:</span>);
        ctx.print(<R>        modified:   ego.txt</R>);
        ctx.print(<R>        deleted:    legs.md</R>);
        ctx.print(<M>no changes added to commit (use &quot;git add&quot; and/or &quot;eat more&quot;)</M>);
        return;
      case "blame":
        ctx.print(
          <Pre>
            <Y>^0000000</Y> (genetics 1998-01-01 1) calves = None{"\n"}
            <Y>^0000000</Y> (genetics 1998-01-01 2) insertions = &quot;high&quot;{"\n"}
            <Y>{hex(8)}</Y> (you      2019-03-04 3) leg_day = False  <M># temporary</M>
          </Pre>,
        );
        return;
      case "checkout":
        ctx.print(<span>Switched to branch &apos;{rest[0] ?? "cut"}&apos;</span>);
        ctx.print(<M>Your physique is still the same. Branches don&apos;t work like that.</M>);
        return;
      default:
        ctx.print(<span>git: &apos;{sub ?? ""}&apos; is not a git command. See &apos;git --help&apos;. Also see a trainer.</span>);
    }
  },
};

const npm: Command = {
  match: ["npm"],
  aliases: [["pnpm"], ["yarn"], ["bun"]],
  usage: "npm install <pkg>",
  summary: "install node_modules (heaviest object in the universe)",
  group: "dev",
  complete: () => ["install"],
  async run(ctx) {
    const [sub, pkg] = ctx.args;
    if (sub !== "install" && sub !== "i" && sub !== "add") {
      ctx.print(<M>npm {sub ?? ""}: only &apos;install&apos; is supported. like real life.</M>);
      return;
    }
    const name = pkg ?? "muscle";
    await progress(ctx, `⸨ ${name} ⸩ reify`, { step: [3, 11], tick: 45 });
    ctx.print(<span>added {intBetween(900, 1500).toLocaleString()} packages, and audited {intBetween(1500, 2100).toLocaleString()} packages in 41s</span>);
    ctx.print(<span><B>{intBetween(180, 260)}</B> packages are looking for funding (protein is expensive)</span>);
    ctx.print(
      <span>
        <R>{intBetween(30, 60)} vulnerabilities</R> ({intBetween(5, 12)} low, {intBetween(10, 20)} moderate, <R>12 skipped leg days</R>)
      </span>,
    );
    ctx.print(<M>To address all issues, run: npm audit fix --squat</M>);
  },
};

const docker: Command = {
  match: ["docker"],
  aliases: [["podman"]],
  usage: "docker run gains",
  summary: "containerize your physique",
  group: "dev",
  complete: () => ["run", "ps"],
  async run(ctx) {
    const [sub] = ctx.args;
    if (sub === "ps") {
      ctx.print(
        <Pre>
          {"CONTAINER ID   IMAGE           STATUS                 NAMES\n"}
          {`${hex(12)}   gains:latest    Up 412 days (pumped)   absolute_unit\n`}
          {`${hex(12)}   legday:2019     Exited (1) 7 years ago leg_day`}
        </Pre>,
      );
      return;
    }
    if (sub !== "run") {
      ctx.print(<M>docker: try &apos;docker run gains&apos; or &apos;docker ps&apos;</M>);
      return;
    }
    await lines(ctx, [
      <span key="1">Unable to find image &apos;gains:latest&apos; locally</span>,
      <span key="2">latest: Pulling from iron/gains</span>,
      <M key="3">{hex(12)}: Pull complete (chicken)</M>,
      <M key="4">{hex(12)}: Pull complete (rice)</M>,
      <M key="5">{hex(12)}: Pull complete (broccoli)</M>,
    ], 260);
    await ctx.sleep(400);
    ctx.print(<span>Starting container… bulking…</span>);
    await progress(ctx, "memory", { tone: "amber", step: [8, 16], tick: 90 });
    ctx.print(<R>Error: container exited with code 137 (OOMKilled): ate the whole buffet.</R>);
    ctx.print(<M>hint: --memory-limit is not respected at all-you-can-eat restaurants.</M>);
    ctx.reject();
  },
};

const ssh: Command = {
  match: ["ssh"],
  usage: "ssh gym",
  summary: "remote into the gym",
  group: "dev",
  complete: () => ["gym", "kitchen", "couch", "gains.sudogetbig.com"],
  async run(ctx) {
    const host = (ctx.args[0] ?? "").replace(/^.*@/, "");
    if (!host) {
      ctx.print(<span>usage: ssh [user@]hostname</span>);
      return;
    }
    await ctx.sleep(500);
    if (host === "gains.sudogetbig.com" || host === "gains") {
      ctx.print(<span>ssh: this is a browser. That host is real, though.</span>);
      ctx.print(
        <span>
          Open an actual terminal (PowerShell, Terminal, anything) and run <G className="font-bold">ssh gains.sudogetbig.com</G>
        </span>,
      );
      ctx.print(<M>Any username, no password. Live lift log, training graph, a fake installer. Press q to leave.</M>);
      return;
    }
    if (host === "gym") {
      const h = new Date().getHours();
      if (h >= 0 && h < 5) {
        ctx.print(<R>ssh: connect to host gym port 22: Connection refused</R>);
        ctx.print(<M>The gym is closed. It&apos;s {h === 0 ? 12 : h}am. Go to sleep. Sleep is part of the program.</M>);
        return;
      }
      ctx.print(<span>Welcome to gym.local (SwoleOS 24.04 LTS)</span>);
      ctx.print(<M>Last login: yesterday from the bench press. 37 people are using the curl rack. 0 are using the squat rack.</M>);
      ctx.print(<span>Connection to gym closed by remote host <M>(you checked your phone for 9 minutes)</M>.</span>);
      return;
    }
    if (host === "kitchen") {
      ctx.print(<Ok>Connected to kitchen. 21 containers of meal prep found. All identical.</Ok>);
      return;
    }
    if (host === "couch") {
      ctx.print(<Y>Warning: couch is a honeypot. Session may last 6 hours.</Y>);
      return;
    }
    ctx.print(<R>ssh: Could not resolve hostname {host}: Name or service not known</R>);
  },
};

const curl: Command = {
  match: ["curl"],
  aliases: [["wget"]],
  usage: "curl gains",
  summary: "download gains from the internet",
  group: "dev",
  async run(ctx) {
    const target = ctx.args.find((a) => !a.startsWith("-")) ?? "";
    if (/^(https?:\/\/)?(www\.)?sudogetbig\.com\/?$/.test(target)) {
      ctx.print(<M>&lt;!doctype html&gt; …you&apos;re already here. this is the page.</M>);
      return;
    }
    await progress(ctx, `Downloading ${target || "gains"}`, { to: 100, step: [10, 30] });
    ctx.print(<span>0 bytes received.</span>);
    ctx.print(<R>curl: (52) Empty reply from server: gains cannot be downloaded. They have to be compiled locally.</R>);
    ctx.reject();
  },
};

export const devCommands: Command[] = [git, npm, docker, ssh, curl];
