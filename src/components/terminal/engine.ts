import type { ReactNode } from "react";
import type { EggId } from "@/lib/eggs";
import type { Mode } from "@/lib/modes";
import type { ToastKind } from "@/components/providers/GainsProvider";
import type { VFS } from "./fs";

/* ------------------------------------------------------------------
   Terminal engine: types, tokenizer, matcher, completion.
   Add a command by appending a `Command` to a file in ./commands and
   registering it in ./commands/index.ts. Nothing else needs to change.
   ------------------------------------------------------------------ */

export class Aborted extends Error {
  constructor() {
    super("aborted");
  }
}

export interface LineHandle {
  update: (node: ReactNode) => void;
}

export type ThemeName = "green" | "amber" | "ice" | "mono";

export interface Ctx {
  /** Tokens after the matched command words. */
  args: string[];
  /** Full raw input line. */
  raw: string;
  /** True when the user typed `sudo` (or is root). */
  sudo: boolean;
  print: (node: ReactNode) => LineHandle;
  /** Waits; throws Aborted on Ctrl+C. Scaled down for reduced motion. */
  sleep: (ms: number) => Promise<void>;
  /** Shows an inline prompt and resolves with what the user types next. */
  ask: (prompt: string) => Promise<string>;
  clear: () => void;
  run: (line: string) => Promise<void>;
  signal: AbortSignal;
  history: string[];
  fs: VFS;
  isRoot: boolean;
  setRoot: (v: boolean) => void;
  setTheme: (t: ThemeName) => void;
  /** Text input interceptor, e.g. vim mode. Return true when handled. */
  setTrap: (trap: ((line: string) => boolean | Promise<boolean>) | null, prompt?: string) => void;
  unlock: (id: EggId) => void;
  toast: (t: { title: string; body?: string; kind: ToastKind }) => void;
  godMode: () => void;
  mode: Mode;
  eggs: EggId[];
  stats: { commands: number; rejected: number; installs: number };
  bump: (k: "commands" | "rejected" | "installs", by?: number) => void;
  excusesKilled: boolean;
  setExcusesKilled: (v: boolean) => void;
  reduced: boolean;
  /** Marks the run as a rejection for stats (funny failures count). */
  reject: () => void;
}

export interface Command {
  /** Words that must match, in order, after an optional leading `sudo`. */
  match: string[];
  /** Alternative spellings. */
  aliases?: string[][];
  /** How it shows up in help, e.g. `sudo apt install <pkg>`. */
  usage: string;
  summary: string;
  group: "gains" | "dev" | "system" | "files" | "misc";
  hidden?: boolean;
  /** Suggestions for the next argument (tab completion). */
  complete?: (args: string[], ctx: Pick<Ctx, "fs">) => string[];
  run: (ctx: Ctx) => void | Promise<void>;
}

/** Split a command line into tokens, honouring "double" and 'single' quotes. */
export function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  let had = false;
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      had = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur || had) out.push(cur);
      cur = "";
      had = false;
      continue;
    }
    cur += ch;
  }
  if (cur || had) out.push(cur);
  return out;
}

export interface Resolved {
  cmd: Command;
  args: string[];
  sudo: boolean;
}

/** Longest-prefix match. A leading `sudo` is stripped and remembered. */
export function resolve(tokens: string[], commands: Command[]): Resolved | null {
  let sudo = false;
  let t = tokens;
  if (t[0] === "sudo" && t.length > 1) {
    sudo = true;
    t = t.slice(1);
  }
  const lower = t.map((x) => x.toLowerCase());
  let best: { cmd: Command; len: number } | null = null;
  for (const cmd of commands) {
    for (const pattern of [cmd.match, ...(cmd.aliases ?? [])]) {
      if (pattern.length > lower.length) continue;
      if (pattern.every((w, i) => w === lower[i]) && (!best || pattern.length > best.len)) {
        best = { cmd, len: pattern.length };
      }
    }
  }
  return best ? { cmd: best.cmd, args: t.slice(best.len), sudo } : null;
}

/** Levenshtein distance, for "did you mean". */
export function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

export function didYouMean(input: string, commands: Command[]): string | null {
  const norm = input.trim().toLowerCase();
  if (!norm) return null;
  const candidates = commands
    .filter((c) => !c.hidden)
    .flatMap((c) => [c.match, ...(c.aliases ?? [])].map((m) => m.join(" ")));
  const stripped = norm.replace(/^sudo\s+/, "");
  let best: { s: string; d: number } | null = null;
  for (const c of candidates) {
    const target = stripped.split(/\s+/).slice(0, c.split(" ").length).join(" ");
    const d = distance(target, c);
    if (d > 0 && d <= Math.max(1, Math.floor(c.length / 4)) && (!best || d < best.d)) best = { s: c, d };
  }
  return best ? best.s : null;
}

/** Every completable full command line (visible commands only). */
export function completionTable(commands: Command[]): string[] {
  const set = new Set<string>();
  for (const c of commands) {
    if (c.hidden) continue;
    const u = c.usage.replace(/\s*[<[].*$/, "").trim();
    if (u) set.add(u);
  }
  return [...set].sort();
}

export function commonPrefix(list: string[]): string {
  if (!list.length) return "";
  let p = list[0];
  for (const s of list) while (!s.startsWith(p)) p = p.slice(0, -1);
  return p;
}

/**
 * Tab completion. Completes whole command lines first, then arguments
 * via the matched command's `complete()`.
 */
export function complete(input: string, commands: Command[], fs: VFS): { value: string; options: string[] } {
  const table = completionTable(commands);
  const lineMatches = table.filter((l) => l.startsWith(input) && l !== input);
  if (lineMatches.length) {
    const prefix = commonPrefix(lineMatches);
    if (lineMatches.length === 1) return { value: lineMatches[0] + " ", options: [] };
    return { value: prefix.length > input.length ? prefix : input, options: lineMatches };
  }

  const endsWithSpace = /\s$/.test(input);
  const tokens = tokenize(input);
  const partial = endsWithSpace ? "" : tokens.pop() ?? "";
  const r = resolve(tokens, commands);
  if (!r?.cmd.complete) return { value: input, options: [] };
  const opts = r.cmd.complete(r.args, { fs }).filter((o) => o.startsWith(partial));
  if (!opts.length) return { value: input, options: [] };
  const base = input.slice(0, input.length - partial.length);
  if (opts.length === 1) {
    const o = opts[0];
    return { value: base + o + (o.endsWith("/") ? "" : " "), options: [] };
  }
  const prefix = commonPrefix(opts);
  return { value: base + (prefix.length > partial.length ? prefix : partial), options: opts };
}
