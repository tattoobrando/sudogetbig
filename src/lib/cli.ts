/* ------------------------------------------------------------------
   curl mode: ANSI rendering + streaming helpers for the CLI endpoints.
   Server-only (used by route handlers).
   ------------------------------------------------------------------ */

import type { Physique } from "./physique";

/** Command-line HTTP clients we answer with text instead of HTML. */
export const CLI_UA = /^(curl|wget|httpie|xh|aria2|libfetch|fetch|lwp|powershell)|windowspowershell/i;

export function isCli(ua: string | null) {
  return !!ua && CLI_UA.test(ua);
}

export interface CliOpts {
  color: boolean;
  animate: boolean;
  powershell: boolean;
}

export function cliOpts(req: Request): CliOpts {
  const url = new URL(req.url);
  const ua = req.headers.get("user-agent") ?? "";
  const powershell = /powershell/i.test(ua);
  const wget = /^wget/i.test(ua);
  const plain = url.searchParams.has("plain") || url.searchParams.has("nocolor");
  return {
    color: !plain && !powershell,
    animate: !plain && !powershell && !wget && !url.searchParams.has("fast"),
    powershell,
  };
}

/* ---------------- colors ---------------- */
export function paint(on: boolean) {
  const w = (code: string) => (s: string | number) => (on ? `\x1b[${code}m${s}\x1b[0m` : String(s));
  return {
    g: w("38;5;48"), // phosphor green
    gb: w("1;38;5;48"),
    y: w("38;5;214"),
    r: w("38;5;203"),
    c: w("38;5;81"),
    v: w("38;5;141"),
    m: w("38;5;246"),
    d: w("38;5;240"),
    b: w("1"),
  };
}
export type Paint = ReturnType<typeof paint>;

/* ---------------- streaming ---------------- */
export interface Out {
  write: (s: string) => void;
  line: (s?: string) => void;
  sleep: (ms: number) => Promise<void>;
  /** Prints a spinner, waits for `work`, then replaces it with ✓ label. */
  step: <T>(label: string, work?: Promise<T> | number) => Promise<T | undefined>;
  /** Types `text` after `prefix`, one character at a time, ending the line. */
  typeLine: (prefix: string, text: string, ms?: number) => Promise<void>;
  p: Paint;
  opts: CliOpts;
}

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/*
  Record-then-play: the script runs first (doing any real work, e.g. GitHub
  fetches) while we record text and pauses. Then we stream the recording,
  sleeping between writes so the terminal animates.
*/
type Ev = { t: "w"; s: string } | { t: "s"; ms: number };

export async function streamText(
  req: Request,
  script: (o: Out) => Promise<void>,
  init: { status?: number; headers?: Record<string, string> } = {},
): Promise<Response> {
  const opts = cliOpts(req);
  const p = paint(opts.color);
  const evs: Ev[] = [];

  const write = (s: string) => {
    const last = evs[evs.length - 1];
    if (last && last.t === "w") last.s += s;
    else evs.push({ t: "w", s });
  };
  const sleep = (ms: number) => {
    if (opts.animate && ms > 0) evs.push({ t: "s", ms });
    return Promise.resolve();
  };
  // Every frame ends with "\n" so curl flushes it (stdout is line-buffered);
  // the next frame moves the cursor up one line and redraws it.
  const UP = "\x1b[1A\r";
  const spin = (label: string, ms: number) => {
    if (!opts.animate) return false;
    const frames = Math.max(3, Math.round(ms / 80));
    for (let i = 0; i < frames; i++) {
      write(`${i ? UP : ""}${p.c(FRAMES[i % FRAMES.length])} ${label}\x1b[K\n`);
      evs.push({ t: "s", ms: 80 });
    }
    return true;
  };

  const o: Out = {
    write,
    line: (s = "") => write(s + "\n"),
    sleep,
    p,
    opts,
    async typeLine(prefix, text, ms = 35) {
      if (!opts.animate) return write(prefix + text + "\n");
      write(prefix + "\n");
      for (let i = 1; i <= text.length; i++) {
        evs.push({ t: "s", ms });
        write(`${UP}${prefix}${text.slice(0, i)}\x1b[K\n`);
      }
    },
    async step<T>(label: string, work?: Promise<T> | number) {
      const isJob = typeof work === "object" && work !== null;
      const ms = typeof work === "number" ? work : 400;
      try {
        const res = isJob ? await (work as Promise<T>) : undefined;
        const spun = spin(label, ms);
        write(`${spun ? UP : ""}${p.g("✓")} ${label}${spun ? "\x1b[K" : ""}\n`);
        return res;
      } catch (e) {
        const spun = spin(label, ms);
        write(`${spun ? UP : ""}${p.r("✗")} ${label}${spun ? "\x1b[K" : ""}\n`);
        throw e;
      }
    },
  };

  try {
    await script(o);
  } catch (e) {
    write(`\n${p.r("segfault (form breakdown):")} ${e instanceof Error ? e.message : "unknown error"}\n`);
  }

  const enc = new TextEncoder();
  const parts = evs.map((e) => (e.t === "w" ? { t: "w" as const, b: enc.encode(e.s) } : e));

  let i = 0;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (i < parts.length && !cancelled) {
        const e = parts[i++];
        if (e.t === "w") {
          controller.enqueue(e.b);
          return; // let the consumer read before continuing
        }
        await new Promise((r) => setTimeout(r, e.ms));
      }
      controller.close();
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(body, {
    status: init.status ?? 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // No Content-Length: with it, proxies may hold the whole body before sending.
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
      "x-content-type-options": "nosniff",
      ...init.headers,
    },
  });
}

/* ---------------- shared pieces ---------------- */
/* A tiny 5-row block font, just for the words we need. */
const FONT: Record<string, string[]> = {
  R: ["███ ", "█  █", "███ ", "█ █ ", "█  █"],
  O: [" ██ ", "█  █", "█  █", "█  █", " ██ "],
  T: ["███", " █ ", " █ ", " █ ", " █ "],
  A: [" ██ ", "█  █", "████", "█  █", "█  █"],
  C: [" ███", "█   ", "█   ", "█   ", " ███"],
  E: ["████", "█   ", "███ ", "█   ", "████"],
  S: [" ███", "█   ", " ██ ", "   █", "███ "],
  G: [" ███", "█   ", "█ ██", "█  █", " ███"],
  I: ["███", " █ ", " █ ", " █ ", "███"],
  N: ["█  █", "██ █", "█ ██", "█  █", "█  █"],
  " ": ["  ", "  ", "  ", "  ", "  "],
  ".": [" ", " ", " ", " ", "█"],
};

export function blockText(word: string): string[] {
  const rows = ["", "", "", "", ""];
  for (const ch of word.toUpperCase()) {
    const g = FONT[ch] ?? FONT[" "];
    for (let i = 0; i < 5; i++) rows[i] += g[i] + " ";
  }
  return rows.map((r) => r.replace(/\s+$/, ""));
}

export function banner(o: Out) {
  for (const l of blockText("ROOT ACCESS")) o.line("  " + o.p.b(l));
  o.line();
  for (const l of blockText("TO GAINS.")) o.line("  " + o.p.gb(l));
  o.line();
  o.line(o.p.m("  sudogetbig.com · SwoleOS 24.04 LTS · unauthorized gains will be prosecuted"));
}

export const FIGURE = [
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

export function bar(p: Paint, pct: number, width = 16) {
  const n = Math.round((Math.max(0, Math.min(100, pct)) / 100) * width);
  return p.d("[") + p.g("█".repeat(n)) + p.d("░".repeat(width - n)) + p.d("]");
}

/** Two columns: left block (art) + right block (key/values). */
export function columns(left: string[], right: string[], leftWidth: number) {
  const rows = Math.max(left.length, right.length);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) out.push((left[i] ?? "").padEnd(leftWidth) + (right[i] ?? ""));
  return out;
}

export function renderPhysique(o: Out, ph: Physique) {
  const { p } = o;
  const header = `${p.gb(ph.login)}${ph.name ? p.m(` (${ph.name})`) : ""}${p.m(" @ github.com")}`;
  const right = [header, p.d("-".repeat(Math.min(32, ph.login.length + 14))), ...ph.stats.map(([k, v]) => `${p.gb(k)}: ${v}`)];
  // color the art after padding so ANSI codes don't break alignment
  const art = ph.art.map((l) => l.padEnd(28));
  columns(art, right, 28).forEach((l, i) => o.line(i < art.length ? p.g(l.slice(0, 28)) + l.slice(28) : l));

  if (ph.muscles.length) {
    o.line();
    o.line(p.c(p.b("MUSCLE GROUPS")));
    for (const m of ph.muscles) {
      o.line(`  ${m.language.padEnd(12).slice(0, 12)} ${bar(p, m.share * 100, 12)} ${String(Math.round(m.share * 100)).padStart(3)}%  ${p.b(m.muscle)} ${p.m("— " + m.note)}`);
    }
  }
  o.line();
  o.line(p.c(p.b("FINDINGS")));
  for (const r of ph.roasts) o.line(`  ${p.y("›")} ${r}`);
  o.line();
  const title = ` ${ph.archetype.toUpperCase()} · GAINS INDEX ${ph.gainsIndex}/100 `;
  o.line(p.g("╭" + "─".repeat(title.length) + "╮"));
  o.line(p.g("│") + p.gb(title) + p.g("│"));
  o.line(p.g("╰" + "─".repeat(title.length) + "╯"));
  o.line(p.m(ph.tagline));
}

export function menu(o: Out) {
  const { p } = o;
  const cmd = o.opts.powershell ? "curl.exe" : "curl";
  const rows: [string, string][] = [
    [`${cmd} -L sudogetbig.com/github/<you>`, "rate your GitHub physique"],
    [`${cmd} -sL sudogetbig.com/install | bash`, "install gains (read it first. seriously.)"],
    [`${cmd} -L sudogetbig.com/lifts`, "root's real training log (charts!)"],
    [`${cmd} -L sudogetbig.com/neofetch`, "system specs"],
    [`${cmd} -L sudogetbig.com/fortune`, "unsolicited wisdom"],
    [`${cmd} -L sudogetbig.com/help`, "this list"],
  ];
  o.line(p.b("try these (they work):"));
  for (const [c, d] of rows) o.line(`  ${p.g(c.padEnd(46))} ${p.m(d)}`);
  o.line();
  o.line(p.m("full interactive terminal: ") + p.c("https://sudogetbig.com") + p.m(" (60+ commands, 10 hidden)"));
  o.line(p.d("no animation on Windows (Git Bash, PowerShell)? add -N:  curl -NL sudogetbig.com"));
  if (o.opts.powershell) {
    o.line();
    o.line(p.m("PowerShell tip: 'curl' here is Invoke-WebRequest. Use curl.exe for colors and animations."));
  }
}
