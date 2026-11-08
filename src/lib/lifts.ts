/* ------------------------------------------------------------------
   Lift log: the summarized Liftoff export (src/data/lifts.json, written
   by `npm run lifts -- export.csv`) plus helpers shared by the /lifts
   page, the curl report and the terminal command.
   ------------------------------------------------------------------ */

import raw from "@/data/lifts.json";

export interface Lift {
  exercise: string;
  group: string;
  sets: number;
  sessions: number;
  first: string;
  last: string;
  /** Only on lifts with 4+ weighted days. */
  start?: number;
  recent?: number;
  best?: number;
  best_date?: string;
  change_pct?: number;
  heaviest?: string;
  series?: [string, number][];
  /** Only on bodyweight / rarely-weighted lifts. */
  best_reps?: number;
}
export type TrackedLift = Lift & Required<Pick<Lift, "start" | "recent" | "best" | "best_date" | "change_pct" | "heaviest" | "series">>;

export interface LiftLog {
  generated: string;
  units: string;
  range: { first: string; last: string; weeks: number };
  totals: {
    sessions: number;
    sets: number;
    reps: number;
    volume: number;
    exercises: number;
    per_week: number;
    avg_minutes: number | null;
    longest_streak: number;
    current_streak: number;
  };
  weekly: { week: string; sessions: number; sets: number; volume: number }[];
  monthly: { month: string; sessions: number; sets: number; volume: number; legs_pct: number }[];
  groups: { group: string; sets: number; share: number }[];
  dow: { day: string; sessions: number }[];
  hours: { hour: number; sessions: number }[];
  lifts: Lift[];
}

export const LOG = raw as unknown as LiftLog;

export const isTracked = (l: Lift): l is TrackedLift => !!l.series && l.series.length > 0;
export const TRACKED: TrackedLift[] = LOG.lifts.filter(isTracked);

/* ---------- formatting ---------- */
export const nf = (n: number) => n.toLocaleString("en-US");
export function compact(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, "") + "M";
  if (n >= 1e4) return Math.round(n / 1e3) + "k";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(Math.round(n));
}
export const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(Math.abs(n) >= 10 ? 0 : 1)}%`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-06" or "2026-06-12" → "Jun 2026" / "Jun 12, 2026" (no Date(), so no timezone drift). */
export function fmtDate(d: string, withYear = true) {
  const [y, m, day] = d.split("-");
  const mon = MONTHS[+m - 1];
  if (!day) return withYear ? `${mon} ${y}` : mon;
  return withYear ? `${mon} ${+day}, ${y}` : `${mon} ${+day}`;
}
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/* ---------- derived findings ---------- */
export function legsTrend(log: LiftLog = LOG) {
  const ms = log.monthly;
  const early = ms.slice(0, Math.min(6, ms.length));
  const recent = ms.slice(-3);
  const share = (xs: typeof ms) => {
    const sets = xs.reduce((s, m) => s + m.sets, 0);
    return sets ? xs.reduce((s, m) => s + (m.legs_pct / 100) * m.sets, 0) / sets * 100 : 0;
  };
  const zero = ms.filter((m) => m.legs_pct === 0).map((m) => m.month);
  return { early: Math.round(share(early)), recent: Math.round(share(recent)), zeroMonths: zero };
}

/** Lifts worth showing off: tracked long enough to mean something. */
export function solidLifts(log: LiftLog = LOG) {
  return log.lifts.filter(isTracked).filter((l) => l.series.length >= 8);
}

export function findings(log: LiftLog = LOG): string[] {
  const t = log.totals;
  const legs = legsTrend(log);
  const solid = solidLifts(log);
  const gainer = [...solid].sort((a, b) => b.change_pct - a.change_pct)[0];
  const top = solid[0];
  const busiest = [...log.dow].sort((a, b) => b.sessions - a.sessions)[0];
  const out: string[] = [];
  if (t.current_streak >= 4)
    out.push(
      t.current_streak === t.longest_streak
        ? `${t.current_streak} straight weeks without a zero. uptime: ${t.current_streak} weeks and counting.`
        : `${t.current_streak}-week streak running (record: ${t.longest_streak}).`,
    );
  if (legs.early - legs.recent >= 5)
    out.push(
      `leg_day.service degraded: legs were ${legs.early}% of sets early on, ${legs.recent}% lately${legs.zeroMonths.length ? ` (0% in ${legs.zeroMonths.map((m) => fmtDate(m, false)).join(" and ")} ${legs.zeroMonths[0].slice(0, 4)})` : ""}.`,
    );
  if (gainer) out.push(`Biggest climb: ${gainer.exercise}, ${pct(gainer.change_pct)} estimated 1RM (${gainer.start} → ${gainer.recent} ${log.units}).`);
  if (top && top !== gainer) out.push(`Most-trained lift: ${top.exercise} (${nf(top.sets)} sets). It knows what it did.`);
  if (busiest) out.push(`Busiest day: ${busiest.day}. ${busiest.day === "Mon" ? "International chest day is real." : "Scheduled like a cron job."}`);
  return out;
}

/** Fuzzy pick for `lifts bench` / `?lift=bench`. */
export function findLift(q: string, lifts: TrackedLift[] = TRACKED): TrackedLift | undefined {
  const s = q.trim().toLowerCase().replace(/[-_+]+/g, " ");
  if (!s) return undefined;
  const words = s.split(/\s+/);
  return (
    lifts.find((l) => l.exercise.toLowerCase() === s) ??
    lifts.find((l) => words.every((w) => l.exercise.toLowerCase().includes(w)))
  );
}

/* ---------- text charts (curl + browser terminal) ---------- */
const TICKS = "▁▂▃▄▅▆▇█";
export function sparkline(values: number[], width?: number) {
  let v = values;
  if (width && v.length > width) {
    // bucket by max so PRs survive downsampling
    const out: number[] = [];
    for (let i = 0; i < width; i++) {
      const a = Math.floor((i * v.length) / width);
      const b = Math.max(a + 1, Math.floor(((i + 1) * v.length) / width));
      out.push(Math.max(...v.slice(a, b)));
    }
    v = out;
  }
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  return v.map((x) => (x <= 0 && lo === 0 ? " " : TICKS[hi === lo ? 3 : Math.round(((x - lo) / (hi - lo)) * 7)])).join("");
}

/** A small multi-row ASCII line chart for one lift. Returns lines (no color). */
export function asciiChart(series: [string, number][], width = 56, height = 9) {
  const vals = series.map(([, v]) => v);
  const cols: number[] = [];
  for (let i = 0; i < width; i++) {
    const a = Math.floor((i * vals.length) / width);
    const b = Math.max(a + 1, Math.floor(((i + 1) * vals.length) / width));
    const chunk = vals.slice(a, b);
    if (chunk.length) cols.push(Math.max(...chunk));
  }
  const lo = Math.floor(Math.min(...vals) / 5) * 5;
  const hi = Math.ceil(Math.max(...vals) / 5) * 5 || 1;
  const rows: string[] = [];
  const lab = (n: number) => String(n).padStart(4);
  for (let r = height - 1; r >= 0; r--) {
    const cut = lo + ((hi - lo) * r) / (height - 1);
    const line = cols.map((v) => (v >= cut ? (v - cut < (hi - lo) / (height - 1) ? "▀" : "█") : " ")).join("");
    const label = r === height - 1 ? lab(hi) : r === 0 ? lab(lo) : r === Math.floor((height - 1) / 2) ? lab(Math.round(cut)) : "    ";
    rows.push(`${label} ┤${line}`);
  }
  rows.push("     └" + "─".repeat(cols.length));
  const left = fmtDate(series[0][0]);
  const right = fmtDate(series[series.length - 1][0]);
  rows.push("      " + left + right.padStart(Math.max(1, cols.length - left.length)));
  return rows;
}
