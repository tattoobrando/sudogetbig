"use client";

import { useMemo, useRef, useState } from "react";
import { fmtDate, nf, pct, type TrackedLift } from "@/lib/lifts";

/*
  Progression chart + lift table. Pick a lift in the menu or click a row;
  hover/drag the chart for each session's best estimated 1RM.
*/

type SortKey = "sets" | "exercise" | "group" | "start" | "recent" | "change_pct" | "best";
const COLS: { key: SortKey; label: string; num?: boolean; hideSm?: boolean }[] = [
  { key: "exercise", label: "Lift" },
  { key: "group", label: "Group", hideSm: true },
  { key: "sets", label: "Sets", num: true, hideSm: true },
  { key: "start", label: "Start", num: true, hideSm: true },
  { key: "recent", label: "Recent", num: true },
  { key: "change_pct", label: "Change", num: true },
  { key: "best", label: "Best", num: true, hideSm: true },
];

function niceTicks(lo: number, hi: number, n = 4) {
  const span = hi - lo || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const a = Math.floor(lo / step) * step;
  const b = Math.ceil(hi / step) * step;
  const out: number[] = [];
  for (let v = a; v <= b + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

function Chart({ lift, units }: { lift: TrackedLift; units: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const s = lift.series;
  const t0 = Date.parse(s[0][0]);
  const t1 = Date.parse(s[s.length - 1][0]);
  const span = Math.max(1, t1 - t0);
  const vals = s.map(([, v]) => v);
  const ticks = niceTicks(Math.min(...vals) * 0.95, Math.max(...vals) * 1.03);
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const x = (d: string) => (s.length === 1 ? 50 : ((Date.parse(d) - t0) / span) * 100);
  const y = (v: number) => 100 - ((v - lo) / (hi - lo || 1)) * 100;
  const line = s.map(([d, v], i) => `${i ? "L" : "M"}${x(d).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const area = `${line} L${x(s[s.length - 1][0]).toFixed(2)},100 L${x(s[0][0]).toFixed(2)},100 Z`;
  const prIdx = vals.indexOf(Math.max(...vals));

  // x-axis: up to 5 evenly spaced month labels
  const xLabels = useMemo(() => {
    const n = Math.min(5, s.length);
    const seen = new Set<string>();
    const out: { at: number; text: string }[] = [];
    for (let k = 0; k < n; k++) {
      const t = t0 + (span * k) / Math.max(1, n - 1);
      const d = new Date(t).toISOString().slice(0, 7);
      if (seen.has(d)) continue;
      seen.add(d);
      out.push({ at: ((t - t0) / span) * 100, text: fmtDate(d).replace(" 20", " ’") });
    }
    return out;
  }, [s, t0, span]);

  const pick = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const f = ((clientX - r.left) / r.width) * 100;
    let best = 0;
    for (let i = 1; i < s.length; i++) if (Math.abs(x(s[i][0]) - f) < Math.abs(x(s[best][0]) - f)) best = i;
    setHover(best);
  };

  const h = hover ?? null;
  const prev = h !== null && h > 0 ? s[h - 1][1] : null;

  return (
    <div className="grid grid-cols-[3.2rem_minmax(0,1fr)] gap-x-2">
      <div className="relative h-64 text-right text-[10.5px] tabular-nums text-dim sm:h-72" aria-hidden>
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${y(t)}%` }}>
            {nf(t)}
          </span>
        ))}
      </div>
      <div
        ref={box}
        className="relative h-64 touch-pan-y select-none sm:h-72"
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${lift.exercise}: estimated one-rep max went from ${lift.start} to ${lift.recent} ${units} over ${s.length} sessions; best ${lift.best} on ${fmtDate(lift.best_date)}.`}
      >
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-line/70" style={{ top: `${y(t)}%` }} aria-hidden />
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="lift-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#lift-fill)" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {s.length <= 60
          ? s.map(([d, v], i) => (
              <span
                key={d}
                className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-panel"
                style={{ left: `${x(d)}%`, top: `${y(v)}%`, opacity: i === prIdx ? 0 : 0.9 }}
                aria-hidden
              />
            ))
          : null}
        {/* PR marker */}
        <span
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber ring-2 ring-panel"
          style={{ left: `${x(s[prIdx][0])}%`, top: `${y(s[prIdx][1])}%` }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -translate-y-full whitespace-nowrap pb-2 text-[10.5px] font-bold text-amber"
          style={{
            left: `${x(s[prIdx][0])}%`,
            top: `${y(s[prIdx][1])}%`,
            transform: `translate(${x(s[prIdx][0]) > 80 ? "-100%" : x(s[prIdx][0]) < 12 ? "0" : "-50%"}, -100%)`,
          }}
          aria-hidden
        >
          PR {nf(s[prIdx][1])}
        </span>

        {h !== null ? (
          <>
            <div className="pointer-events-none absolute inset-y-0 border-l border-muted/60" style={{ left: `${x(s[h][0])}%` }} aria-hidden />
            <span
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-panel"
              style={{ left: `${x(s[h][0])}%`, top: `${y(s[h][1])}%` }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute top-1 z-10 rounded-md border border-line-2 bg-panel-2 px-2.5 py-1.5 text-[11.5px] leading-snug shadow-lg"
              style={x(s[h][0]) > 60 ? { right: `${100 - x(s[h][0])}%`, marginRight: 10 } : { left: `${x(s[h][0])}%`, marginLeft: 10 }}
            >
              <div className="text-muted">{fmtDate(s[h][0])}</div>
              <div>
                <b className="text-text">{nf(s[h][1])}</b> <span className="text-muted">{units} est. 1RM</span>
              </div>
              {prev !== null ? (
                <div className={s[h][1] > prev ? "text-accent" : s[h][1] < prev ? "text-red" : "text-muted"}>
                  {s[h][1] === prev ? "same as last time" : `${s[h][1] > prev ? "▲" : "▼"} ${Math.abs(s[h][1] - prev)} vs last time`}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
      <div />
      <div className="relative mt-1.5 h-4 text-[10.5px] text-dim" aria-hidden>
        {xLabels.map((l, i) => (
          <span
            key={l.text}
            className={`absolute whitespace-nowrap ${i % 2 && xLabels.length > 3 ? "hidden sm:inline" : ""}`}
            style={{ left: `${l.at}%`, transform: i === 0 ? "none" : i === xLabels.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
          >
            {l.text}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LiftExplorer({ lifts, units, lastDay }: { lifts: TrackedLift[]; units: string; lastDay: string }) {
  const [name, setName] = useState(lifts[0]?.exercise ?? "");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "sets", dir: -1 });
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const lift = lifts.find((l) => l.exercise === name) ?? lifts[0];

  const rows = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const xs = lifts.filter((l) => words.every((w) => `${l.exercise} ${l.group}`.toLowerCase().includes(w)));
    return [...xs].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      return (typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)) * sort.dir;
    });
  }, [lifts, q, sort]);
  const shown = all || q ? rows : rows.slice(0, 15);

  const choose = (n: string) => {
    setName(n);
    chartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!lift) return null;
  const sinceBest = Math.round((Date.parse(lastDay) - Date.parse(lift.best_date)) / 86400000);
  const byGroup = [...new Set(lifts.map((l) => l.group))].sort();

  return (
    <div className="space-y-5">
      <div ref={chartRef} className="scroll-mt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="block min-w-0 flex-1">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-dim">lift</span>
            <select
              value={lift.exercise}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md rounded-md border border-line-2 bg-bg-2 px-3 py-2 text-[13px] text-text outline-none focus:border-accent"
            >
              {byGroup.map((g) => (
                <optgroup key={g} label={g}>
                  {lifts
                    .filter((l) => l.group === g)
                    .map((l) => (
                      <option key={l.exercise} value={l.exercise}>
                        {l.exercise} ({l.series.length} sessions)
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {[
            ["start → recent", `${nf(lift.start)} → ${nf(lift.recent)}`, units + " est. 1RM"],
            ["change", pct(lift.change_pct), `over ${lift.series.length} sessions`],
            ["best", nf(lift.best), `${fmtDate(lift.best_date)}${sinceBest > 0 ? ` · ${sinceBest}d ago` : " · latest session"}`],
            ["heaviest set", lift.heaviest.replace(" x ", " × "), units + " × reps"],
          ].map(([k, v, sub], i) => (
            <div key={k}>
              <div className="text-[11px] uppercase tracking-[0.14em] text-dim">{k}</div>
              <div className={`text-xl font-bold tabular-nums ${i === 1 ? (lift.change_pct >= 0 ? "text-accent" : "text-red") : "text-text"}`}>{v}</div>
              <div className="text-[11.5px] text-muted">{sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <Chart key={lift.exercise} lift={lift} units={units} />
        </div>
        <p className="mt-3 text-[11.5px] text-dim">
          Each point is the best estimated one-rep max from that day (Epley: weight × (1 + reps ÷ 30), sets of 1–15 reps). <span className="text-amber">●</span> marks the PR.
        </p>
      </div>

      <div className="border-t border-line pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[12px] uppercase tracking-[0.14em] text-dim">
            all tracked lifts <span className="text-muted">({lifts.length})</span> — click one to chart it
          </h3>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="grep lifts…"
            aria-label="Filter lifts"
            className="w-full rounded-md border border-line-2 bg-bg-2 px-3 py-1.5 text-[13px] text-text outline-none placeholder:text-dim focus:border-accent sm:w-56"
          />
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line-2 text-[11px] uppercase tracking-wider text-dim">
                {COLS.map((c) => (
                  <th key={c.key} className={`py-2 pr-3 font-normal ${c.num ? "text-right" : "text-left"} ${c.hideSm ? "hidden sm:table-cell" : ""}`} aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                    <button
                      type="button"
                      onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? ((-s.dir) as 1 | -1) : c.num ? -1 : 1 }))}
                      className="uppercase tracking-wider hover:text-text"
                    >
                      {c.label}
                      {sort.key === c.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((l) => (
                <tr
                  key={l.exercise}
                  onClick={() => choose(l.exercise)}
                  className={`cursor-pointer border-b border-line/60 hover:bg-panel-2 ${l.exercise === lift.exercise ? "bg-accent-soft" : ""}`}
                >
                  <td className="py-2 pr-3">
                    <button type="button" onClick={(e) => (e.stopPropagation(), choose(l.exercise))} className="text-left text-text hover:text-accent">
                      {l.exercise}
                    </button>
                  </td>
                  <td className="hidden py-2 pr-3 text-muted sm:table-cell">{l.group}</td>
                  <td className="hidden py-2 pr-3 text-right tabular-nums text-muted sm:table-cell">{nf(l.sets)}</td>
                  <td className="hidden py-2 pr-3 text-right tabular-nums text-muted sm:table-cell">{nf(l.start)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{nf(l.recent)}</td>
                  <td className={`py-2 pr-3 text-right tabular-nums ${l.change_pct > 0 ? "text-accent" : l.change_pct < 0 ? "text-red" : "text-muted"}`}>{pct(l.change_pct)}</td>
                  <td className="hidden py-2 pr-3 text-right tabular-nums text-muted sm:table-cell">{nf(l.best)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!q && rows.length > 15 ? (
          <button type="button" onClick={() => setAll((a) => !a)} className="mt-3 text-[12.5px] text-accent hover:underline">
            {all ? "$ head -n 15" : `$ cat --all  (${rows.length - 15} more)`}
          </button>
        ) : null}
        {q && !rows.length ? <p className="mt-3 text-[12.5px] text-muted">grep: no lifts match “{q}”.</p> : null}
      </div>
    </div>
  );
}
