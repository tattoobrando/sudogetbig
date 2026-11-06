"use client";

import type { Command, Ctx, ThemeName } from "../engine";
import { B, C, G, M, Ok, Pre, R, Swatches, V, Y } from "../Out";
import { lines } from "./helpers";
import { EGGS, EGG_COUNT, type EggId } from "@/lib/eggs";
import { MODE_LABEL } from "@/lib/modes";
import { pick, between } from "@/lib/random";
import { buildReport } from "@/lib/report";
import { copyText } from "@/lib/clipboard";

export const PHYSIQUE = [
  "   _                 _   ",
  "  ( \\    .---.     / )  ",
  "   \\ \\  ( o_o )   / /   ",
  "    \\ \\__\\ - /___/ /    ",
  "     \\    `-'     /     ",
  "      '-._|   |_.-'      ",
  "          |   |          ",
  "          |___|          ",
  "          / | \\          ",
  "         /  |  \\         ",
  "        (__/ \\__)        ",
];

const whoami: Command = {
  match: ["whoami"],
  usage: "whoami",
  summary: "existential check",
  group: "system",
  run(ctx) {
    if (ctx.isRoot) {
      ctx.print(<span>root</span>);
      ctx.print(<M>Absolute unit. Please use your powers responsibly (you won&apos;t).</M>);
      return;
    }
    ctx.print(<span>gains</span>);
    ctx.print(<M>Intermediate lifter with advanced confidence.</M>);
  },
};

const id: Command = {
  match: ["id"],
  usage: "id",
  summary: "user and group ids",
  group: "system",
  run(ctx) {
    ctx.print(
      <span>
        uid={ctx.isRoot ? "0(root)" : "1000(gains)"} gid=1000(lifters) groups=1000(lifters),27(sudo),404(abs),1337(gym-bros)
      </span>,
    );
  },
};

function topFrame(tick: number) {
  const j = (n: number, spread = 4) => Math.max(0, Math.min(99.9, n + between(-spread, spread))).toFixed(1).padStart(5);
  const rows: [string, string, string, string, string][] = [
    ["1", "root", j(97, 2), "42.0", "protein_synthesis"],
    ["7", "gains", j(84), "12.3", "recovery_daemon --best-effort"],
    ["23", "gains", j(66, 8), " 8.0", "soreness --doms=chest"],
    ["42", "gains", j(38, 12), " 6.6", "existential_dread"],
    ["69", "gains", j(24, 10), " 4.2", "mirror_check --flex --angles=all"],
    ["101", "gains", j(14, 6), " 3.1", "chicken_rice_broccoli.service"],
    ["404", "gains", "  0.0", " 0.0", "calves (sleeping since birth)"],
    ["666", "gains", "  0.0", " 0.0", "leg_day <defunct>"],
  ];
  const t = 6 * 3600 + 12 * 60 + 44 + tick;
  const clock = [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60].map((x) => String(x).padStart(2, "0")).join(":");
  return (
    <Pre>
      <span>top - {clock} up 412 days,  2 users,  load average: <Y>100.0, 120.0, 160.0</Y> <M>(bench, squat, deadlift)</M></span>
      {"\n"}Tasks: <B>8</B> total, <G>1</G> running, 6 sleeping (badly), 0 stopped, <R>1 zombie (leg_day)</R>
      {"\n"}%Cpu(s): <B>{j(91, 3)}</B> us, 6.0 sy, 0.0 ni, 0.4 id (rest periods), 2.6 wa (waiting for squat rack)
      {"\n"}MiB Mem:  82000 total (bodyweight, in grams),  <Y>4500 kcal free</Y>
      {"\n\n"}
      <span className="bg-text/10 text-text">{"  PID USER      %CPU  %MEM COMMAND                              "}</span>
      {"\n"}
      {rows.map((r) => (
        <span key={r[0]} className={r[4].includes("defunct") ? "text-red" : r[0] === "1" ? "text-accent" : ""}>
          {r[0].padStart(5)} {r[1].padEnd(8)} {r[2]} {r[3].padStart(5)} {r[4]}
          {"\n"}
        </span>
      ))}
      <M>press q or Ctrl+C to quit</M>
    </Pre>
  );
}

const top: Command = {
  match: ["top"],
  aliases: [["htop"], ["btop"]],
  usage: "top",
  summary: "live process table",
  group: "system",
  async run(ctx) {
    const h = ctx.print(topFrame(0));
    try {
      for (let i = 1; i <= 40; i++) {
        await ctx.sleep(1000);
        h.update(topFrame(i));
      }
    } finally {
      // leave the final frame on screen
    }
  },
};

const ps: Command = {
  match: ["ps"],
  usage: "ps aux",
  summary: "list processes",
  group: "system",
  run(ctx) {
    ctx.print(
      <Pre>
        {"USER       PID %CPU COMMAND\n"}
        {"root         1 97.0 protein_synthesis\n"}
        {"gains        7 84.0 recovery_daemon\n"}
        {`gains     4812 ${ctx.excusesKilled ? " 0.0 [excuses] (stopped)" : "12.0 excuses --generate --daemon"}\n`}
        {"gains      404  0.0 calves\n"}
        <R>{"gains      666  0.0 [leg_day] <defunct>"}</R>
      </Pre>,
    );
  },
};

const kill: Command = {
  match: ["kill"],
  aliases: [["pkill"], ["killall"]],
  usage: "kill -9 excuses",
  summary: "terminate a process",
  group: "system",
  complete: () => ["-9", "excuses", "leg_day", "calves", "protein_synthesis"],
  async run(ctx) {
    const target = ctx.args.find((a) => !a.startsWith("-")) ?? "";
    if (!target) {
      ctx.print(<span>kill: usage: kill [-9] &lt;pid|name&gt;</span>);
      return;
    }
    if (/excuse|4812/.test(target)) {
      ctx.setExcusesKilled(true);
      ctx.print(<Ok>excuses (pid 4812) terminated.</Ok>);
      await ctx.sleep(1400);
      ctx.print(<Y>excuses.service: Main process exited; Restart=always. Spawning new excuse: &quot;it&apos;s cold out&quot;</Y>);
      ctx.setExcusesKilled(false);
      return;
    }
    if (/leg_day|666/.test(target)) {
      ctx.print(<M>kill: (666) - process is already dead. it&apos;s a zombie. it has been since 2019.</M>);
      return;
    }
    if (/protein|^1$/.test(target)) {
      ctx.print(<R>kill: (1) - Operation not permitted. Over our dead body (and your gains&apos;).</R>);
      ctx.reject();
      return;
    }
    if (/calves|404/.test(target)) {
      ctx.print(<M>kill: (404) - can&apos;t kill what never lived.</M>);
      return;
    }
    ctx.print(<span>kill: ({target}) - No such process</span>);
  },
};

const neofetch: Command = {
  match: ["neofetch"],
  aliases: [["fastfetch"], ["screenfetch"]],
  usage: "neofetch",
  summary: "system specs (yours)",
  group: "system",
  run(ctx) {
    const info: [string, string][] = [
      ["OS", "SwoleOS 24.04 LTS (Long Term Swole) x86_64"],
      ["Host", "Absolute Unit 1.0 (migrated from Dad Bod v2.1)"],
      ["Kernel", "6.9.0-hypertrophy"],
      ["Uptime", "412 days (last rest day: disputed)"],
      ["Packages", "8 muscles (apt), 0 calves"],
      ["Shell", "protein-shake 5.2"],
      ["Mode", `${MODE_LABEL[ctx.mode]}.target`],
      ["Resolution", "1920x1080 (bathroom mirror)"],
      ["WM", "Barbell (tiling, 20kg)"],
      ["CPU", "Creatine Monohydrate @ 5g/day"],
      ["GPU", "Pre-Workout RTX 400mg"],
      ["Memory", "Muscle memory: permanent"],
      ["Eggs", `${ctx.eggs.length}/${EGG_COUNT} found`],
    ];
    ctx.print(
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <Pre className="text-accent">{PHYSIQUE.join("\n")}</Pre>
        <div className="leading-[1.35]">
          <div>
            <G className="font-bold">{ctx.isRoot ? "root" : "gains"}</G>@<G className="font-bold">sudogetbig</G>
          </div>
          <div className="text-dim">{"-".repeat(18)}</div>
          {info.map(([k, v]) => (
            <div key={k}>
              <G className="font-bold">{k}</G>: {v}
            </div>
          ))}
          <div className="mt-1.5">
            <Swatches />
          </div>
        </div>
      </div>,
    );
  },
};

const ping: Command = {
  match: ["ping"],
  usage: "ping gains",
  summary: "check connectivity to your goals",
  group: "system",
  complete: () => ["gains", "protein", "abs", "legday", "gym"],
  async run(ctx) {
    const host = (ctx.args.find((a) => !a.startsWith("-")) ?? "").toLowerCase();
    if (!host) {
      ctx.print(<span>ping: usage error: Destination address required</span>);
      return;
    }
    if (host === "legday" || host === "leg_day" || host === "calves") {
      ctx.print(<R>ping: {host}: Name or service not known</R>);
      ctx.reject();
      return;
    }
    if (/google|github|\.com|\.org|\.net/.test(host)) {
      ctx.print(<M>ping: outbound network disabled during sets. You&apos;re supposed to be resting, not browsing.</M>);
      return;
    }
    const replies = host === "protein" || host === "gym" || host === "pizza";
    ctx.print(<span>PING {host} (10.0.4.{host.length * 7}) 56(84) bytes of data.</span>);
    for (let i = 0; i < 4; i++) {
      await ctx.sleep(replies ? 420 : 900);
      ctx.print(
        replies ? (
          <span>
            64 bytes from {host} ({host === "protein" ? "whey" : host === "pizza" ? "extra cheese" : "the iron"}): icmp_seq={i + 1} ttl=64 time={(0.2 + Math.random()).toFixed(2)} ms
          </span>
        ) : (
          <Y>Request timeout for icmp_seq {i}</Y>
        ),
      );
    }
    ctx.print(<M>--- {host} ping statistics ---</M>);
    if (replies) {
      ctx.print(<span>4 packets transmitted, 4 received, 0% packet loss. {host} is always there for you.</span>);
    } else {
      ctx.print(<span>4 packets transmitted, 0 received, <R>100% packet loss</R></span>);
      ctx.print(<Y>Request timed out. Progressive overload may be required.</Y>);
      ctx.reject();
    }
  },
};

const uname: Command = {
  match: ["uname"],
  usage: "uname -a",
  summary: "kernel info",
  group: "system",
  run(ctx) {
    ctx.print(<span>Linux sudogetbig 6.9.0-hypertrophy #1 SMP PREEMPT_DYNAMIC Mon (chest day) x86_64 GNU/Lifter</span>);
  },
};

const uptime: Command = {
  match: ["uptime"],
  usage: "uptime",
  summary: "how long since the last rest day",
  group: "system",
  run(ctx) {
    const mins = ctx.stats.commands;
    ctx.print(<span> 06:12:44 up 412 days, 3:07,  1 user,  load average: 100.0, 120.0, 160.0</span>);
    ctx.print(<M> this session: {mins} commands. none of them were cardio.</M>);
  },
};

const date: Command = {
  match: ["date"],
  usage: "date",
  summary: "what day is it (chest)",
  group: "system",
  run(ctx) {
    const d = new Date();
    const day = d.toLocaleDateString("en-US", { weekday: "long" });
    ctx.print(<span>{d.toString().replace(/\s\(.+\)$/, "")}</span>);
    ctx.print(<M>{day === "Monday" ? "Monday. International Chest Day. Benches are booked until 9pm." : `${day}. Statistically, also chest day.`}</M>);
  },
};

const df: Command = {
  match: ["df"],
  usage: "df -h",
  summary: "disk usage",
  group: "system",
  run(ctx) {
    ctx.print(
      <Pre>
        {"Filesystem        Size  Used Avail Use% Mounted on\n"}
        <R>{"/dev/stomach      2.0L  1.9L   0.1L  98% /meal (you had seconds)\n"}</R>
        {"/dev/delts        4.0G  3.1G   0.9G  77% /shoulders\n"}
        {"/dev/sleep        8.0h  5.2h   2.8h  65% /bed\n"}
        {"/dev/patience     1.0K  1.0K     0  100% /progress\n"}
        <M>{"/dev/calves          0     0      0    - /dev/null"}</M>
      </Pre>,
    );
  },
};

const free: Command = {
  match: ["free"],
  usage: "free -h",
  summary: "memory (muscle and otherwise)",
  group: "system",
  run(ctx) {
    ctx.print(
      <Pre>
        {"               total        used        free      cached\n"}
        {"Mem:          8 years     3 years     5 years   bench technique\n"}
        {"Muscle mem:   permanent   permanent         0   every PR\n"}
        <M>{"Swap:         cheat meal  cheat meal        0   (swapped Sunday)"}</M>
      </Pre>,
    );
  },
};

const historyCmd: Command = {
  match: ["history"],
  usage: "history",
  summary: "your past commands",
  group: "files",
  run(ctx) {
    const h = ctx.history.slice(-30);
    if (!h.length) {
      ctx.print(<M>no history. a fresh start. very inspirational.</M>);
      return;
    }
    const start = ctx.history.length - h.length + 1;
    ctx.print(<Pre>{h.map((c, i) => `${String(start + i).padStart(5)}  ${c}`).join("\n")}</Pre>);
  },
};

const ENV: Record<string, string> = {
  USER: "gains",
  HOME: "/home/gains",
  SHELL: "/usr/bin/protein-shake",
  PROTEIN: "200g",
  REST: "90",
  GAINS: "true",
  CALVES: "",
  PATH: "/usr/local/iron:/usr/bin/gym:/home/gains/.excuses (deprecated)",
  EDITOR: "vim (we're sorry)",
  LEG_DAY: "undefined",
};

const echo: Command = {
  match: ["echo"],
  usage: "echo <text> | echo $PROTEIN",
  summary: "print text (env vars work)",
  group: "files",
  run(ctx) {
    const out = ctx.args.join(" ").replace(/\$(\w+)|\$\{(\w+)\}/g, (_, a, b) => ENV[a ?? b] ?? "");
    ctx.print(<span>{out}</span>);
  },
};

const env: Command = {
  match: ["env"],
  aliases: [["printenv"]],
  usage: "env",
  summary: "environment variables",
  group: "files",
  run(ctx) {
    ctx.print(<Pre>{Object.entries(ENV).map(([k, v]) => `${k}=${v}`).join("\n")}</Pre>);
  },
};

/* ---------------- files ---------------- */
const ls: Command = {
  match: ["ls"],
  aliases: [["ll"], ["dir"]],
  usage: "ls [-a] [path]",
  summary: "list files",
  group: "files",
  complete: (_a, { fs }) => ["-a", ...fs.names("")],
  run(ctx) {
    const all = ctx.args.some((a) => a.startsWith("-") && a.includes("a")) || ctx.raw.trim().startsWith("ll");
    const path = ctx.args.find((a) => !a.startsWith("-")) ?? ".";
    if (ctx.fs.resolve(path) === "/gym/squat_rack" && !all) {
      ctx.print(<M>squat_rack is occupied. someone is curling in it. (try ls -a)</M>);
      return;
    }
    const list = ctx.fs.list(path, all);
    if (!list) {
      ctx.print(<span>ls: cannot access &apos;{path}&apos;: No such file or directory</span>);
      return;
    }
    if (!list.length) {
      ctx.print(<M>(empty)</M>);
      return;
    }
    const meal = list.filter((x) => x.name.startsWith("chicken_rice_broccoli_"));
    const rest = list.filter((x) => !x.name.startsWith("chicken_rice_broccoli_"));
    ctx.print(
      <div className="flex flex-wrap gap-x-5 gap-y-0.5">
        {(all ? [{ name: ".", dir: true }, { name: "..", dir: true }, ...rest] : rest).map((x) => (
          <span key={x.name} className={x.dir ? "font-bold text-cyan" : x.name.endsWith(".exe") || x.name.endsWith(".sh") ? "text-accent" : ""}>
            {x.name}
            {x.dir && x.name !== "." && x.name !== ".." ? "/" : ""}
          </span>
        ))}
        {meal.length ? (
          <span className="text-muted">
            chicken_rice_broccoli_01.txt … chicken_rice_broccoli_{String(meal.length).padStart(2, "0")}.txt ({meal.length} identical files)
          </span>
        ) : null}
      </div>,
    );
  },
};

const cd: Command = {
  match: ["cd"],
  usage: "cd <dir>",
  summary: "change directory",
  group: "files",
  complete: (_a, { fs }) => fs.names("").filter((n) => n.endsWith("/")),
  run(ctx) {
    const target = ctx.args[0] ?? "~";
    if (/^\/?bellyfat\/?$/.test(target) || ctx.fs.resolve(target) === "/bellyfat") {
      const err = ctx.fs.cd(target);
      if (!err) ctx.print(<M>it&apos;s dark in here. you can feel the abs, but you can&apos;t see them.</M>);
      return;
    }
    const err = ctx.fs.cd(target);
    if (err) ctx.print(<span>{err}</span>);
  },
};

const pwd: Command = {
  match: ["pwd"],
  usage: "pwd",
  summary: "where am I",
  group: "files",
  run(ctx) {
    ctx.print(<span>{ctx.fs.pwd()}</span>);
  },
};

const cat: Command = {
  match: ["cat"],
  aliases: [["less"], ["more"], ["bat"]],
  usage: "cat <file>",
  summary: "read a file",
  group: "files",
  complete: (_a, { fs }) => fs.names(""),
  run(ctx) {
    const p = ctx.args[0];
    if (!p) {
      ctx.print(<M>cat: waiting for stdin. (it&apos;s a cat. it&apos;s ignoring you.)</M>);
      return;
    }
    if (/excuses(\.txt)?$/.test(p)) {
      ctx.print(<span>cat: {p}: No such file or directory</span>);
      ctx.print(<M>(excuses.txt was removed in v2.0.0. see the changelog.)</M>);
      return;
    }
    const n = ctx.fs.get(p);
    if (!n) {
      ctx.print(<span>cat: {p}: No such file or directory</span>);
      return;
    }
    if (n.type === "dir") {
      ctx.print(<span>cat: {p}: Is a directory</span>);
      return;
    }
    if (p.endsWith(".secret_stash")) ctx.unlock("stash");
    ctx.print(<Pre className="whitespace-pre-wrap">{n.content || <M>(empty)</M>}</Pre>);
  },
};

const chmod: Command = {
  match: ["chmod"],
  aliases: [["chown"]],
  usage: "chmod +x legs",
  summary: "change permissions",
  group: "files",
  run(ctx) {
    const t = ctx.args[ctx.args.length - 1] ?? "";
    if (/leg/.test(t)) {
      ctx.print(<R>chmod: changing permissions of &apos;{t}&apos;: Operation not permitted. legs are read-only.</R>);
      ctx.reject();
      return;
    }
    ctx.print(<M>chmod: &apos;{t || "?"}&apos;: permissions updated. it is still not executable. neither is your diet.</M>);
  },
};

/* ---------------- misc ---------------- */
const THEMES: ThemeName[] = ["green", "amber", "ice", "mono"];
const theme: Command = {
  match: ["theme"],
  usage: "theme <green|amber|ice|mono>",
  summary: "change terminal colors",
  group: "misc",
  complete: () => THEMES,
  run(ctx) {
    const t = ctx.args[0] as ThemeName | undefined;
    if (!t || !THEMES.includes(t)) {
      ctx.print(<span>usage: theme &lt;{THEMES.join("|")}&gt;</span>);
      return;
    }
    ctx.setTheme(t);
    ctx.print(<Ok>theme set to {t}.</Ok>);
  },
};

const FORTUNES = [
  "Your genetics are a legacy dependency.",
  "Skipping leg day is a known vulnerability.",
  "Your bench press is not production-ready.",
  "404: Visible abs not found.",
  "Have you tried turning your metabolism off and back on?",
  "This physique is still in beta.",
  "Your muscle growth has been rate-limited.",
  "Built different. Compiled incorrectly.",
  "Warning: ego lifting detected in production.",
  "Works on my machine (the Smith machine).",
  "There are two hard problems in lifting: rest periods, naming your split, and off-by-one rep counts.",
  "It's not a bulk if you can't see your feet. It's a deployment.",
  "Real programmers count from 0. Real lifters count the half reps.",
  "Your form has merge conflicts.",
  "Deload week is just a scheduled outage.",
];

const fortune: Command = {
  match: ["fortune"],
  usage: "fortune",
  summary: "unsolicited wisdom",
  group: "misc",
  run(ctx) {
    ctx.print(<V>{pick(FORTUNES)}</V>);
  },
};

const report: Command = {
  match: ["report"],
  usage: "report",
  summary: "copy your Gains System Report",
  group: "misc",
  async run(ctx) {
    const text = buildReport({ mode: ctx.mode, eggs: ctx.eggs.length, stats: ctx.stats, excusesKilled: ctx.excusesKilled });
    ctx.print(<Pre className="text-muted">{text}</Pre>);
    const ok = await copyText(text);
    ctx.print(ok ? <Ok>Copied to clipboard. Paste it somewhere that will judge you.</Ok> : <Y>Couldn&apos;t copy automatically — select the text above.</Y>);
  },
};

const achievements: Command = {
  match: ["achievements"],
  aliases: [["eggs"]],
  usage: "achievements",
  summary: "easter eggs found so far",
  group: "misc",
  run(ctx) {
    ctx.print(<span>Easter eggs: <B>{ctx.eggs.length}/{EGG_COUNT}</B></span>);
    (Object.keys(EGGS) as EggId[]).forEach((id) => {
      const got = ctx.eggs.includes(id);
      ctx.print(got ? <Ok>{EGGS[id]}</Ok> : <M>  ░░░░░░░░░░░░░░░░ (locked)</M>);
    });
    if (ctx.eggs.length < EGG_COUNT) ctx.print(<M>hint: {pick(["real terminals have editors you can't exit", "typos are features", "some files are hidden", "old cheat codes still work", "sudo can be asked for favors", "the page itself listens for a famous sequence"])}</M>);
  },
};

const exit: Command = {
  match: ["exit"],
  aliases: [["logout"], ["quit"], [":q"]],
  usage: "exit",
  summary: "leave",
  group: "misc",
  run(ctx) {
    if (ctx.isRoot) {
      ctx.setRoot(false);
      ctx.print(<M>logout. back to limited privileges. it was fun while it lasted.</M>);
      return;
    }
    ctx.print(<span>There is no exit. There is only the next set.</span>);
  },
};

const cardio: Command = {
  match: ["cardio"],
  aliases: [["run"], ["jog"], ["treadmill"]],
  usage: "cardio",
  summary: "",
  group: "misc",
  hidden: true,
  run(ctx) {
    ctx.print(<span>bash: cardio: command not found. Did you mean <G>carbs</G>?</span>);
  },
};

const carbs: Command = {
  match: ["carbs"],
  usage: "carbs",
  summary: "",
  group: "misc",
  hidden: true,
  run(ctx) {
    ctx.print(<Ok>carbs loaded. 400g. glycogen: full. regrets: pending.</Ok>);
  },
};

const brew: Command = {
  match: ["brew"],
  aliases: [["coffee"], ["preworkout"]],
  usage: "brew install preworkout",
  summary: "",
  group: "misc",
  hidden: true,
  run(ctx) {
    ctx.print(<R>brew: command not found. This is Linux.</R>);
    ctx.print(<M>Also you&apos;ve had four already. Your heart rate is visible from orbit.</M>);
  },
};

const sudoAlone: Command = {
  match: ["sudo"],
  usage: "sudo <command>",
  summary: "do it, but with authority",
  group: "misc",
  async run(ctx) {
    const sub = ctx.args.join(" ");
    if (!sub) {
      ctx.print(<span>usage: sudo &lt;command&gt;</span>);
      ctx.print(<M>Getting big requires a command. Try: <G>sudo get big</G></M>);
      return;
    }
    if (sub === "!!") {
      const last = [...ctx.history].reverse().find((h) => h !== "sudo !!" && h.trim());
      if (!last) {
        ctx.print(<M>sudo: !!: no previous command. bold of you.</M>);
        return;
      }
      const line = last.startsWith("sudo ") ? last : `sudo ${last}`;
      ctx.print(<C>{line}</C>);
      await ctx.run(line);
      return;
    }
    // Unknown sudo command (resolve() only lands here when nothing matched).
    ctx.print(<span>sudo: {ctx.args[0]}: command not found</span>);
    ctx.print(<M>Elevating a command that doesn&apos;t exist does not make it exist. Same with gains.</M>);
    ctx.reject();
  },
};

const motd: Command = {
  match: ["motd"],
  usage: "motd",
  summary: "",
  group: "misc",
  hidden: true,
  async run(ctx: Ctx) {
    await lines(ctx, [<span key="1">Welcome to SwoleOS 24.04 LTS (Long Term Swole).</span>, <M key="2">Unauthorized gains will be prosecuted.</M>]);
  },
};

export const systemCommands: Command[] = [
  whoami, id, top, ps, kill, neofetch, ping, uname, uptime, date, df, free,
  historyCmd, echo, env, ls, cd, pwd, cat, chmod,
  theme, fortune, report, achievements, exit, cardio, carbs, brew, sudoAlone, motd,
];
