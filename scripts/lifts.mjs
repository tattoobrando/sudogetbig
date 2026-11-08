#!/usr/bin/env node
/*
  Turns a Liftoff CSV export into src/data/lifts.json for /lifts.

    npm run lifts -- path/to/liftoff_workout_data.csv

  Only summarized numbers are written: totals, weekly/monthly rollups and a
  best-estimated-1RM-per-day series for each lift. Raw rows, notes, RPE and
  timestamps are never written, so the export itself stays on your machine.
*/
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const src = process.argv[2];
if (!src) {
  console.error("usage: npm run lifts -- path/to/liftoff_workout_data.csv");
  process.exit(1);
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(root, "src/data/lifts.json");

/* ---------- CSV (RFC 4180: quotes, doubled quotes, newlines in fields) ---------- */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let f = "";
  let q = false;
  const endField = () => {
    row.push(f);
    f = "";
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c !== '"') f += c;
      else if (text[i + 1] === '"') f += text[++i];
      else q = false;
    } else if (c === '"') q = true;
    else if (c === ",") endField();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endField();
      rows.push(row);
      row = [];
    } else f += c;
  }
  if (f || row.length) {
    endField();
    rows.push(row);
  }
  const [head, ...body] = rows;
  const keys = head.map((h) => h.replace(/^﻿/, "").trim());
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] ?? ""])));
}

const raw = parseCsv(readFileSync(src, "utf8"));
for (const k of ["Date", "Exercise Name", "Weight", "Reps", "Duration"]) {
  if (!raw.length || !(k in raw[0])) {
    console.error(`That doesn't look like a Liftoff export (missing "${k}" column).`);
    process.exit(1);
  }
}

/* ---------- muscle groups, from exercise names (first match wins) ---------- */
const RULES = [
  ["Forearms", /wrist|reverse (barbell|ez bar) curl|dead hang|dumb+ell hold/],
  ["Legs", /leg (press|extension|curl)|squat|hack|lunge|calf|adduct|abduct|rdl|romanian|deadlift|hip thrust|glute|step ?up|split/],
  ["Back", /row|pulldown|pull ?ups?|\bchin|straight arm|pullover|back ext/],
  ["Triceps", /tricep|pushdown|skull|kickback|close grip|dip/],
  ["Biceps", /curl/],
  ["Shoulders", /lateral raise|shoulder|reverse fly|rear delt|face pull|upright|front raise|overhead press|military|shrug/],
  ["Chest", /chest|fly|bench|pec|push ?up|incline press/],
  ["Core", /crunch|sit-?up|plank|flutter|heel touch|oblique|leg raise|knee raise|twist/],
];
const group = (name) => (RULES.find(([, re]) => re.test(name.toLowerCase())) ?? ["Other"])[0];

/* Epley estimate; very high-rep sets make it unreliable, so skip them. */
const e1rm = (w, n) => (w > 0 && n > 0 && n <= 15 ? w * (1 + n / 30) : 0);

const minutes = (s) => {
  let t = 0;
  for (const [, v, u] of s.matchAll(/(\d+)\s*(hour|minute|second)/g)) t += +v * { hour: 60, minute: 1, second: 1 / 60 }[u];
  return t;
};

// Dates are local wall-clock times with no zone; treat them as UTC so nothing shifts.
const day = (d) => d.slice(0, 10);
const toDate = (d) => new Date(d.slice(0, 10) + "T00:00:00Z");
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const DAY = 86400000;
const weekOf = (d) => {
  const t = toDate(d);
  return iso(t.getTime() - ((t.getUTCDay() + 6) % 7) * DAY); // Monday
};

const rows = raw
  .filter((r) => r["Exercise Name"].trim() && /^\d{4}-\d\d-\d\d/.test(r.Date))
  .map((r) => ({
    date: r.Date,
    ex: r["Exercise Name"].trim(),
    w: parseFloat(r.Weight) || 0,
    n: Math.round(parseFloat(r.Reps) || 0),
    dur: r.Duration,
    g: group(r["Exercise Name"]),
  }))
  .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

const unmapped = [...new Set(rows.filter((r) => r.g === "Other").map((r) => r.ex))];
if (unmapped.length) console.warn("No muscle group for:", unmapped.join(", "), "(add a rule in scripts/lifts.mjs)");

// One session = one workout start timestamp.
const sessions = new Map();
for (const r of rows) (sessions.get(r.date) ?? sessions.set(r.date, []).get(r.date)).push(r);

const first = rows[0].date;
const last = rows[rows.length - 1].date;
const weeks = (toDate(last) - toDate(first)) / DAY / 7;

/* ---------- weekly (every week in range, including empty ones) ---------- */
const weekly = new Map();
for (let t = toDate(weekOf(first)).getTime(); t <= toDate(last).getTime(); t += 7 * DAY) weekly.set(iso(t), { week: iso(t), sessions: 0, sets: 0, volume: 0 });
for (const [d, rs] of sessions) {
  const w = weekly.get(weekOf(d));
  w.sessions++;
  w.sets += rs.length;
  w.volume += rs.reduce((s, r) => s + r.w * r.n, 0);
}
const weeklyArr = [...weekly.values()].map((w) => ({ ...w, volume: Math.round(w.volume) }));

let longest = 0;
let run = 0;
for (const w of weeklyArr) {
  run = w.sessions ? run + 1 : 0;
  longest = Math.max(longest, run);
}
let current = 0;
for (let i = weeklyArr.length - 1; i >= 0 && weeklyArr[i].sessions; i--) current++;

/* ---------- monthly ---------- */
const monthly = new Map();
for (const [d, rs] of sessions) {
  const k = d.slice(0, 7);
  const m = monthly.get(k) ?? monthly.set(k, { month: k, sessions: 0, sets: 0, volume: 0, legs: 0 }).get(k);
  m.sessions++;
  m.sets += rs.length;
  m.volume += rs.reduce((s, r) => s + r.w * r.n, 0);
  m.legs += rs.filter((r) => r.g === "Legs").length;
}
const monthlyArr = [...monthly.values()].map(({ legs, ...m }) => ({
  ...m,
  volume: Math.round(m.volume),
  legs_pct: m.sets ? Math.round((legs / m.sets) * 1000) / 10 : 0,
}));

/* ---------- groups, days, hours ---------- */
const count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map());
const groups = [...count(rows.map((r) => r.g))]
  .sort((a, b) => b[1] - a[1])
  .map(([g, n]) => ({ group: g, sets: n, share: Math.round((n / rows.length) * 1000) / 10 }));
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dowC = count([...sessions.keys()].map((d) => DOW[(toDate(d).getUTCDay() + 6) % 7]));
const hourC = count([...sessions.keys()].map((d) => +d.slice(11, 13)));

/* ---------- per lift ---------- */
const byEx = new Map();
for (const r of rows) (byEx.get(r.ex) ?? byEx.set(r.ex, []).get(r.ex)).push(r);

const lifts = [];
for (const [name, rs] of byEx) {
  const best = new Map(); // day -> best e1RM that day
  for (const r of rs) {
    const v = e1rm(r.w, r.n);
    if (v > 0) best.set(day(r.date), Math.max(best.get(day(r.date)) ?? 0, v));
  }
  const base = {
    exercise: name,
    group: rs[0].g,
    sets: rs.length,
    sessions: new Set(rs.map((r) => r.date)).size,
    first: day(rs[0].date),
    last: day(rs[rs.length - 1].date),
  };
  if (best.size < 4) {
    lifts.push({ ...base, best_reps: Math.max(0, ...rs.map((r) => r.n)) });
    continue;
  }
  const keys = [...best.keys()];
  const vals = [...best.values()];
  const k = Math.max(1, Math.min(3, Math.floor(vals.length / 4))); // average a few sessions at each end
  const avg = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const start = avg(vals.slice(0, k));
  const recent = avg(vals.slice(-k));
  const peak = Math.max(...vals);
  const peakDay = keys[vals.indexOf(peak)];
  const top = rs.filter((r) => r.w > 0 && r.n > 0).reduce((a, b) => (b.w > a.w || (b.w === a.w && b.n > a.n) ? b : a));
  lifts.push({
    ...base,
    start: Math.round(start),
    recent: Math.round(recent),
    best: Math.round(peak),
    best_date: peakDay,
    change_pct: Math.round(((recent - start) / start) * 1000) / 10,
    heaviest: `${top.w} x ${top.n}`,
    series: keys.map((d, i) => [d, Math.round(vals[i])]),
  });
}
lifts.sort((a, b) => b.sets - a.sets);

const durations = [...sessions.values()].map((rs) => minutes(rs[0].dur)).filter((m) => m >= 5 && m <= 240);

const out = {
  generated: new Date().toISOString().slice(0, 10),
  units: "lb",
  range: { first: day(first), last: day(last), weeks: Math.round(weeks * 10) / 10 },
  totals: {
    sessions: sessions.size,
    sets: rows.length,
    reps: rows.reduce((s, r) => s + r.n, 0),
    volume: Math.round(rows.reduce((s, r) => s + r.w * r.n, 0)),
    exercises: byEx.size,
    per_week: Math.round((sessions.size / Math.max(1, weeks)) * 100) / 100,
    avg_minutes: durations.length ? Math.round(avg0(durations)) : null,
    longest_streak: longest,
    current_streak: current,
  },
  weekly: weeklyArr,
  monthly: monthlyArr,
  groups,
  dow: DOW.map((d) => ({ day: d, sessions: dowC.get(d) ?? 0 })),
  hours: Array.from({ length: 24 }, (_, h) => ({ hour: h, sessions: hourC.get(h) ?? 0 })),
  lifts,
};
function avg0(xs) {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out) + "\n");
const t = out.totals;
console.log(
  `wrote src/data/lifts.json: ${t.sessions} sessions, ${t.sets} sets, ${lifts.length} exercises, ${out.range.first} → ${out.range.last}`,
);
