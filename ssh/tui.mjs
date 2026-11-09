/*
  The full-screen terminal app each SSH visitor gets. Pure ANSI: we redraw
  the whole screen on every change (it's tiny), using the alternate screen
  buffer so the visitor's scrollback is untouched when they leave.
*/
import {
  asciiChart,
  compact,
  findings,
  fmtDate,
  HEAT_CHARS,
  isTracked,
  legsTrend,
  nf,
  pct,
  sparkline,
  textHeatmap,
} from "../src/lib/liftsCore.ts";
import { FORTUNES } from "../src/lib/fortunes.ts";

const ESC = "\x1b[";
const color = (code) => (s) => `${ESC}${code}m${s}${ESC}0m`;
const C = {
  b: color("1"),
  dim: color("38;5;240"),
  m: color("38;5;246"),
  y: color("38;5;214"),
  r: color("38;5;203"),
  c: color("38;5;81"),
  v: color("38;5;141"),
  inv: color("7"),
};

const ANSI_RE = /\x1b\[[0-9;?]*[A-Za-z]/g;
const vis = (s) => [...s.replace(ANSI_RE, "")].length;
const pad = (s, w) => s + " ".repeat(Math.max(0, w - vis(s)));
/** Cut a string with color codes to `w` visible columns. */
function fit(s, w) {
  let out = "";
  let n = 0;
  for (let i = 0; i < s.length; ) {
    if (s[i] === "\x1b") {
      const m = /^\x1b\[[0-9;?]*[A-Za-z]/.exec(s.slice(i));
      if (m) {
        out += m[0];
        i += m[0].length;
        continue;
      }
    }
    const ch = String.fromCodePoint(s.codePointAt(i));
    if (n >= w) break;
    out += ch;
    n++;
    i += ch.length;
  }
  return out + `${ESC}0m`;
}

const FIGURE = [
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
const SPIN = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const TABS = ["status", "lifts", "graph", "install", "fortune"];
const KONAMI = ["up", "up", "down", "down", "left", "right", "left", "right", "b", "a"];

export class Session {
  /**
   * @param {import("node:stream").Duplex} stream
   * @param {{ user: string, cols: number, rows: number, data: () => any, visits: number, onClose: () => void }} o
   */
  constructor(stream, o) {
    this.s = stream;
    this.user = (o.user || "guest").replace(/[^\w.-]/g, "").slice(0, 24) || "guest";
    this.cols = o.cols || 80;
    this.rows = o.rows || 24;
    this.data = o.data;
    this.visits = o.visits;
    this.onClose = o.onClose;
    this.tab = -1; // -1 = boot
    this.boot = 0;
    this.sel = 0;
    this.scroll = 0;
    this.god = false;
    this.keys = [];
    this.toast = "";
    this.fortune = Math.floor(Math.random() * FORTUNES.length);
    this.inst = { phase: "idle", lines: [], answer: null };
    this.timers = new Set();
    this.closed = false;
  }

  /* ---------- lifecycle ---------- */
  start() {
    this.out(`${ESC}?1049h${ESC}?25l${ESC}2J`);
    const step = () => {
      if (this.tab !== -1) return;
      this.boot++;
      this.draw();
      if (this.boot < this.bootLines().length) this.later(step, this.boot < 3 ? 120 : 190);
      else this.later(() => this.tab === -1 && this.go(0), 1400);
    };
    this.later(step, 150);
    this.draw();
  }

  close(goodbye = true) {
    if (this.closed) return;
    this.closed = true;
    for (const t of this.timers) clearTimeout(t);
    try {
      this.out(`${ESC}0m${ESC}?25h${ESC}?1049l`);
      if (goodbye) this.out(`${this.accent("Connection to gains closed.")} Go hit legs.\r\n`);
      this.s.exit?.(0);
      this.s.end();
    } catch {
      /* already gone */
    }
    this.onClose?.();
  }

  resize(cols, rows) {
    this.cols = Math.max(20, Math.min(400, cols | 0));
    this.rows = Math.max(8, Math.min(200, rows | 0));
    this.out(`${ESC}2J`);
    this.draw();
  }

  later(fn, ms) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      if (!this.closed) fn();
    }, ms);
    this.timers.add(t);
  }

  out(s) {
    if (!this.closed || s.includes("?1049l") || s.includes("closed")) this.s.write(s);
  }

  accent(s) {
    return `${ESC}${this.god ? "38;5;214" : "38;5;48"}m${s}${ESC}0m`;
  }

  /* ---------- input ---------- */
  input(buf) {
    const str = buf.toString("utf8").slice(0, 64); // nobody needs to paste a novel
    const keys = [];
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === "\x1b" && str[i + 1] === "[") {
        const k = { A: "up", B: "down", C: "right", D: "left" }[str[i + 2]];
        keys.push(k || "esc");
        i += 2;
      } else if (ch === "\x1b" && str[i + 1] === "O") {
        keys.push({ A: "up", B: "down", C: "right", D: "left" }[str[i + 2]] || "esc");
        i += 2;
      } else if (ch === "\x1b") keys.push("esc");
      else if (ch === "\r" || ch === "\n") keys.push("enter");
      else if (ch === "\t") keys.push("tab");
      else if (ch === "\x03" || ch === "\x04") keys.push("quit");
      else keys.push(ch.toLowerCase());
    }
    for (const k of keys) this.key(k);
  }

  key(k) {
    if (this.closed) return;
    this.keys = [...this.keys, k].slice(-KONAMI.length);
    if (this.keys.join() === KONAMI.join()) {
      this.god = !this.god;
      this.flash(this.god ? "GOD MODE: accent recolored. Gains unchanged." : "God mode off. Back to mortal green.");
    }
    if (k === "quit" || k === "q") return this.close();
    if (this.tab === -1) return this.go(0);

    if (/^[1-5]$/.test(k)) return this.go(+k - 1);
    if (k === "tab") return this.go((this.tab + 1) % TABS.length);
    if ((k === "right" || k === "l") && this.tab !== 1) return this.go((this.tab + 1) % TABS.length);
    if ((k === "left" || k === "h") && this.tab !== 1) return this.go((this.tab + TABS.length - 1) % TABS.length);

    const log = this.data();
    if (this.tab === 1 && log) {
      const n = log.lifts.filter(isTracked).length;
      if (k === "down" || k === "j" || k === "right") this.sel = Math.min(n - 1, this.sel + 1);
      if (k === "up" || k === "k" || k === "left") this.sel = Math.max(0, this.sel - 1);
      if (k === "g") this.sel = 0;
    }
    if (this.tab === 3) this.installKey(k);
    if (this.tab === 4 && (k === " " || k === "enter" || k === "n")) this.fortune = (this.fortune + 1 + Math.floor(Math.random() * (FORTUNES.length - 1))) % FORTUNES.length;
    this.draw();
  }

  go(t) {
    this.tab = t;
    this.out(`${ESC}2J`);
    this.draw();
  }

  flash(msg) {
    this.toast = msg;
    this.later(() => {
      this.toast = "";
      this.draw();
    }, 3500);
  }

  /* ---------- drawing ---------- */
  draw() {
    if (this.closed) return;
    const W = this.cols;
    const H = this.rows;
    let lines;
    if (W < 60 || H < 18) {
      lines = ["", ` ${C.y("Terminal too small.")}`, ` Need at least 60×18 (you have ${W}×${H}).`, " Resize the window, or press q to quit."];
    } else if (this.tab === -1) {
      lines = this.bootLines().slice(0, this.boot);
    } else {
      const bodyH = H - 5;
      const body = [this.status, this.liftsTab, this.graph, this.install, this.fortuneTab][this.tab].call(this, W, bodyH);
      lines = [this.header(W), this.tabsLine(W), C.dim("─".repeat(W)), ...body.slice(0, bodyH)];
      while (lines.length < H - 2) lines.push("");
      lines.push(C.dim("─".repeat(W)), this.footer(W));
    }
    const frame = lines.slice(0, H).map((l) => fit(l, W) + `${ESC}K`);
    this.out(`${ESC}H${frame.join("\r\n")}${ESC}J`);
  }

  header(W) {
    const left = ` ${this.accent(C.b("sudo get big"))} ${C.m("· SwoleOS 24.04 LTS · ssh edition")}`;
    const right = `${C.m(this.user + "@gains")} `;
    return left + " ".repeat(Math.max(1, W - vis(left) - vis(right))) + right;
  }

  tabsLine() {
    return (
      " " +
      TABS.map((t, i) => (i === this.tab ? C.inv(this.accent(` ${i + 1} ${t} `)) : ` ${C.dim(String(i + 1))} ${C.m(t)} `)).join(" ")
    );
  }

  footer(W) {
    if (this.toast) return " " + C.y(this.toast);
    const hints = {
      0: "1-5 or ←/→ switch tabs",
      1: "↑/↓ pick a lift · 1-5 tabs",
      2: "1-5 or ←/→ switch tabs",
      3: this.inst.phase === "ask" ? "y / n" : "enter install · 1-5 tabs",
      4: "space another one · 1-5 tabs",
    }[this.tab];
    const right = C.dim("q quit ");
    const left = " " + C.dim(hints);
    return left + " ".repeat(Math.max(1, W - vis(left) - vis(right))) + right;
  }

  bootLines() {
    const log = this.data();
    const ok = this.accent(" ok ");
    const lines = [
      C.m("SwoleOS 24.04 LTS (GNU/Gains 6.8.0-swole x86_64)"),
      "",
      `[${ok}] Mounting /dev/delts`,
      `[${ok}] Loading creatine.ko`,
      `[${ok}] Starting gains.service`,
      `[${C.r("FAIL")}] Starting leg_day.service ${C.dim("— see 'journalctl -u leg_day'")}`,
      `[${ok}] Reached target Massive.`,
      "",
      this.user === "root" ? `${C.b("Logged in as root.")} ${C.m("Bold. Also, no password was required. Obviously.")}` : `Welcome, ${C.b(this.user)}. ${C.m("Root access to gains granted.")}`,
      log
        ? C.m(`Last workout: ${fmtDate(log.range.last)} · streak: ${log.totals.current_streak} weeks · visitor #${nf(this.visits)}`)
        : C.m(`Lift data is warming up · visitor #${nf(this.visits)}`),
      "",
      C.dim("press any key"),
    ];
    return lines.map((l) => " " + l);
  }

  noData() {
    return ["", ` ${C.y("Lift data hasn't loaded yet.")}`, " The website might be mid-deploy. Try again in a minute."];
  }

  status(W, H) {
    const log = this.data();
    if (!log) return this.noData();
    const t = log.totals;
    const legs = legsTrend(log);
    const tracked = log.lifts.filter(isTracked).length;
    const kv = (k, v) => `${this.accent(C.b(k))}: ${v}`;
    const right = [
      `${this.accent(C.b(this.user))}@${this.accent(C.b("gains"))}`,
      C.dim("-".repeat(this.user.length + 6)),
      kv("OS", "SwoleOS 24.04 LTS (ssh edition)"),
      kv("Host", `root's Liftoff log, ${fmtDate(log.range.first)} → ${fmtDate(log.range.last)}`),
      kv("Uptime", t.current_streak === t.longest_streak ? `${t.current_streak} weeks, no missed weeks` : `${t.current_streak} weeks (record ${t.longest_streak})`),
      kv("Sessions", `${nf(t.sessions)} (${t.per_week}/week, ~${t.avg_minutes ?? "?"} min)`),
      kv("Packages", `${t.exercises} lifts (${tracked} tracked)`),
      kv("Volume", `${compact(t.volume)} ${log.units} moved · ${nf(t.sets)} sets · ${nf(t.reps)} reps`),
      kv("Legs", C.r(`${legs.recent}% of sets (degraded, was ${legs.early}%)`)),
      kv("Shell", "ssh, no password. Nothing to hack here but your ego."),
      kv("Visitors", nf(this.visits)),
      "",
      [48, 81, 141, 214, 203, 246].map((c) => `${ESC}48;5;${c}m   ${ESC}0m`).join(""),
    ];
    const wide = W >= 84;
    const rows = [""];
    const n = Math.max(wide ? FIGURE.length : 0, right.length);
    for (let i = 0; i < n; i++) rows.push(wide ? " " + this.accent(pad(FIGURE[i] ?? "", 28)) + (right[i] ?? "") : " " + (right[i] ?? ""));
    rows.push("", " " + C.c(C.b("FINDINGS")));
    for (const f of findings(log)) rows.push(`  ${C.y("›")} ${f}`);
    return rows.slice(0, H);
  }

  liftsTab(W, H) {
    const log = this.data();
    if (!log) return this.noData();
    const list = log.lifts.filter(isTracked);
    if (!list.length) return this.noData();
    this.sel = Math.min(this.sel, list.length - 1);
    const l = list[this.sel];
    const wide = W >= 90;
    const LW = wide ? Math.min(36, Math.floor(W * 0.36)) : 0;
    const RW = W - LW - (wide ? 3 : 1);

    const right = [
      "",
      this.accent(C.b(l.exercise)) + C.m(`  ${l.group} · ${l.series.length} sessions · ${nf(l.sets)} sets`),
      "",
      `${C.m("est. 1RM")}   ${nf(l.start)} → ${C.b(nf(l.recent))} ${log.units}   ${(l.change_pct >= 0 ? (s) => this.accent(s) : C.r)(pct(l.change_pct))}`,
      `${C.m("best")}       ${C.y(nf(l.best))} ${C.m(`on ${fmtDate(l.best_date)}`)}`,
      `${C.m("heaviest")}   ${l.heaviest.replace(" x ", ` ${log.units} × `)} reps`,
      "",
    ];
    const chartH = Math.max(4, Math.min(14, H - right.length - 4));
    for (const row of asciiChart(l.series, Math.max(16, RW - 8), chartH)) {
      const cut = row.indexOf("┤");
      right.push(cut > 0 ? C.dim(row.slice(0, cut + 1)) + this.accent(row.slice(cut + 1)) : C.dim(row));
    }
    right.push("", C.dim("each point: best estimated 1RM that day (Epley, 1–15 reps)"));
    if (!wide) {
      right.splice(1, 0, C.m(`◀ ${this.sel + 1}/${list.length} ▶`));
      return right.map((r) => " " + r).slice(0, H);
    }

    const rowsVisible = H - 2;
    if (this.sel < this.scroll) this.scroll = this.sel;
    if (this.sel >= this.scroll + rowsVisible) this.scroll = this.sel - rowsVisible + 1;
    const left = [C.dim(` ${pad("lift", LW - 9)}change`)];
    for (let i = this.scroll; i < Math.min(list.length, this.scroll + rowsVisible); i++) {
      const x = list[i];
      const name = x.exercise.length > LW - 10 ? x.exercise.slice(0, LW - 11) + "…" : x.exercise;
      const ch = pct(x.change_pct).padStart(6);
      const line = ` ${pad(name, LW - 9)}${ch} `;
      left.push(i === this.sel ? C.inv(this.accent(line)) : ` ${pad(name, LW - 9)}${x.change_pct >= 0 ? this.accent(ch) : C.r(ch)} `);
    }
    if (list.length > rowsVisible) left.push(C.dim(` ${this.scroll + 1}-${Math.min(list.length, this.scroll + rowsVisible)} of ${list.length}`));
    const out = [];
    for (let i = 0; i < H; i++) out.push(pad(fit(left[i] ?? "", LW), LW) + C.dim(" │ ") + (right[i] ?? ""));
    return out;
  }

  graph(W, H) {
    const log = this.data();
    if (!log) return this.noData();
    const hm = textHeatmap(log, Math.max(8, Math.min(log.weekly.length, W - 10)));
    const shade = (lv) => {
      const ch = HEAT_CHARS[lv + 1];
      if (lv <= 0) return C.dim(ch);
      return this.god ? `${ESC}38;5;${[0, 94, 130, 172, 214][lv]}m${ch}${ESC}0m` : `${ESC}38;5;${[0, 22, 28, 35, 48][lv]}m${ch}${ESC}0m`;
    };
    const rows = ["", " " + C.c(C.b("GIT LOG --GRAPH")) + C.m(`  training days, last ${hm.weeks} weeks`), "      " + C.dim(hm.months)];
    for (const r of hm.rows) rows.push(`  ${C.dim(r.label)} ${r.levels.map(shade).join("")}`);
    rows.push(C.m(`      ${hm.trained} training days out of ${hm.span}   `) + C.dim("· rest ") + [1, 2, 3, 4].map(shade).join("") + C.dim(" more sets"));

    rows.push("", " " + C.c(C.b("MUSCLE GROUPS")) + C.m("  share of all sets"));
    const max = Math.max(...log.groups.map((g) => g.share));
    const bw = Math.min(30, W - 26);
    for (const g of log.groups) {
      const n = Math.round((g.share / max) * bw);
      const bar = (g.group === "Legs" ? C.r : (s) => this.accent(s))("█".repeat(n)) + C.dim("░".repeat(bw - n));
      rows.push(`  ${g.group === "Legs" ? C.r(pad(g.group, 10)) : pad(g.group, 10)} ${bar} ${String(g.share).padStart(5)}%`);
    }
    const legs = legsTrend(log);
    rows.push("", " " + C.c(C.b("LEG_DAY.SERVICE")) + C.m("  legs share by month"));
    rows.push("  " + C.r(sparkline(log.monthly.map((m) => m.legs_pct))) + C.m(`  ${legs.early}% early → ${legs.recent}% lately`));
    return rows.slice(0, H);
  }

  /* ---------- fake installer ---------- */
  installKey(k) {
    const i = this.inst;
    if (i.phase === "ask") {
      if (k === "y" || k === "enter" || k === "n") {
        i.answer = k === "n" ? "n" : "y";
        i.lines.push(`Start leg_day.service now? [Y/n] ${i.answer}`);
        i.phase = "running";
        this.runInstall(i.resume);
      }
      return;
    }
    if (k === "enter" && i.phase !== "running") {
      this.inst = { phase: "running", lines: [], answer: null };
      this.runInstall(0);
    }
  }

  runInstall(from) {
    const i = this.inst;
    const ok = (s) => `${this.accent("✓")} ${s}`;
    const script = [
      [() => i.lines.push(this.accent(C.b(`${this.user}@gains:~$ sudo apt install gains`))), 300],
      [() => i.lines.push(`[sudo] password for ${this.user}: ********`), 500],
      [() => i.lines.push(C.m("  (relax. nothing was typed, read, or stored.)")), 300],
      [() => i.lines.push("Reading package lists... Done", "Building dependency tree... Done"), 400],
      [() => i.lines.push(ok("Detecting hardware: 1 human (unoptimized)")), 450],
      [() => i.lines.push(ok("Checking protein levels: insufficient")), 450],
      [() => i.lines.push(ok("Locating calves")), 600],
      [() => i.lines.push(C.r("  E: Unable to locate package calves"), C.m("  ERROR 404: Genetics not found for this architecture.")), 500],
      ["bar", "Downloading creatine"],
      ["bar", "Compiling chest_day"],
      ["bar", "Linking mind_muscle"],
      [() => i.lines.push(ok("Mounting /dev/delts"), ok("Disabling excuses.service")), 400],
      [() => i.lines.push(`${C.y("  WARNING:")} leg_day.service has not been started.`), 300],
      ["ask"],
      [
        () =>
          i.lines.push(
            i.answer === "n"
              ? C.m("  Correct choice, statistically.")
              : C.r("  Job for leg_day.service failed: remembered something urgent at home."),
          ),
        500,
      ],
      [
        () => {
          const box = " STATUS: MASSIVE PRIVILEGES GRANTED ";
          i.lines.push(
            "",
            this.accent("╭" + "─".repeat(box.length) + "╮"),
            this.accent("│") + this.accent(C.b(box)) + this.accent("│"),
            this.accent("╰" + "─".repeat(box.length) + "╯"),
            `Congratulations, ${this.user}. You are now ${C.b(`0.00${1 + Math.floor(Math.random() * 7)}%`)} more jacked.`,
            "",
            C.dim("press enter to reinstall (results will not improve)"),
          );
          i.phase = "done";
        },
        0,
      ],
    ];
    const run = (n) => {
      if (this.inst !== i || this.closed) return;
      if (n >= script.length) return this.draw();
      const [what, arg] = script[n];
      if (what === "ask") {
        i.phase = "ask";
        i.resume = n + 1;
        return this.draw();
      }
      if (what === "bar") {
        const idx = i.lines.push("") - 1;
        let p = 0;
        const tick = () => {
          if (this.inst !== i) return;
          const w = 24;
          const f = Math.round((p / 100) * w);
          i.lines[idx] = `${pad(arg, 22)} ${C.dim("[")}${this.accent("#".repeat(f))}${C.dim(".".repeat(w - f) + "]")} ${String(p).padStart(3)}%`;
          this.draw();
          if (p >= 100) return this.later(() => run(n + 1), 150);
          p = Math.min(100, p + 4 + Math.floor(Math.random() * 9));
          this.later(tick, 45);
        };
        return tick();
      }
      what();
      this.draw();
      this.later(() => run(n + 1), arg);
    };
    run(from);
  }

  install(W, H) {
    const i = this.inst;
    if (i.phase === "idle") {
      return [
        "",
        ` ${C.b("Gains Installer")} ${C.m("v6.9.0")}`,
        "",
        ` Press ${this.accent(C.b("enter"))} to run ${this.accent("sudo apt install gains")}.`,
        "",
        C.m(" It only prints text. Unlike that script you piped into bash once."),
      ];
    }
    const lines = i.lines.map((l) => " " + l);
    if (i.phase === "ask") lines.push(` Start leg_day.service now? [Y/n] ${this.accent("█")}`);
    if (i.phase === "running") lines.push(` ${C.c(SPIN[Math.floor(Date.now() / 90) % SPIN.length])}`);
    return ["", ...lines.slice(-(H - 1))];
  }

  fortuneTab(W) {
    const f = FORTUNES[this.fortune];
    const width = Math.min(W - 6, Math.max(30, f.length + 4));
    const words = f.split(" ");
    const wrapped = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > width - 4) {
        wrapped.push(cur.trim());
        cur = w;
      } else cur += " " + w;
    }
    wrapped.push(cur.trim());
    return [
      "",
      "",
      "  " + C.v("╭" + "─".repeat(width - 2) + "╮"),
      ...wrapped.map((l) => "  " + C.v("│ ") + pad(l, width - 4) + C.v(" │")),
      "  " + C.v("╰" + "─".repeat(width - 2) + "╯"),
      "  " + C.dim("  — /usr/games/fortune --swole"),
    ];
  }
}
