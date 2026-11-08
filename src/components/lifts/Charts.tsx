import type { ReactNode } from "react";
import { compact, fmtDate, nf, type LiftLog } from "@/lib/lifts";

/*
  Server-rendered bar charts built from plain HTML so they stay crisp and
  readable at any width. Each bar has a hover/focus tooltip.
*/

function Tip({ children, align = "center" }: { children: ReactNode; align?: "center" | "left" | "right" }) {
  const pos = align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-md border border-line-2 bg-panel-2 px-2.5 py-1.5 text-[11.5px] leading-snug text-text shadow-lg group-hover:block group-focus-visible:block ${pos}`}
    >
      {children}
    </span>
  );
}

export function Panel({ id, title, kicker, children, className = "" }: { id?: string; title: string; kicker?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`rounded-xl border border-line bg-panel p-4 sm:p-5 ${className}`}>
      <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-cyan">{title}</h2>
      {kicker ? <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{kicker}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Sessions per week, every week in range (gaps show as empty slots). */
export function WeeklyBars({ log }: { log: LiftLog }) {
  const ws = log.weekly;
  const max = Math.max(...ws.map((w) => w.sessions), 1);
  const ticks = ws.map((w, i) => ({ w, i })).filter(({ w, i }) => i === 0 || w.week.slice(5, 7) !== ws[i - 1].week.slice(5, 7));
  return (
    <div>
      <div className="relative flex h-40 items-end gap-[2px]" role="img" aria-label={`Sessions per week over ${ws.length} weeks, between 0 and ${max}.`}>
        {[...Array(max + 1).keys()].slice(1).map((n) => (
          <div key={n} className="pointer-events-none absolute inset-x-0 border-t border-line/70" style={{ bottom: `${(n / max) * 100}%` }} aria-hidden>
            {n === max || n === Math.ceil(max / 2) ? <span className="absolute -top-2 right-full mr-1.5 text-[10px] text-dim">{n}</span> : null}
          </div>
        ))}
        {ws.map((w, i) => (
          <div key={w.week} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
            <div
              className={`w-full rounded-t-[3px] ${w.sessions ? "bg-accent/80 group-hover:bg-accent group-focus-visible:bg-accent" : ""}`}
              style={{ height: `${(w.sessions / max) * 100}%`, minHeight: w.sessions ? 3 : 0 }}
            />
            {!w.sessions ? <div className="absolute inset-x-0 bottom-0 h-[3px] rounded bg-red/70" /> : null}
            <Tip align={i < 6 ? "left" : i > ws.length - 7 ? "right" : "center"}>
              <span className="text-muted">week of {fmtDate(w.week)}</span>
              <br />
              <b>{w.sessions}</b> sessions · {nf(w.sets)} sets · {compact(w.volume)} lb
            </Tip>
          </div>
        ))}
      </div>
      <div className="relative mt-1.5 h-4 text-[10.5px] text-dim">
        {ticks
          .filter((_, k) => k % 3 === 0)
          .map(({ w, i }, k) => (
            <span key={w.week} className={`absolute whitespace-nowrap ${k % 2 ? "hidden sm:inline" : ""}`} style={{ left: `${(i / ws.length) * 100}%` }}>
              {w.week.slice(5, 7) === "01" || i === 0 ? fmtDate(w.week.slice(0, 7)).replace(" 20", " ’") : fmtDate(w.week.slice(0, 7), false)}
            </span>
          ))}
      </div>
    </div>
  );
}

/** Legs share of sets per month. Months well below the early average get the red. */
export function LegsBars({ log, early }: { log: LiftLog; early: number }) {
  const ms = log.monthly;
  const max = Math.max(...ms.map((m) => m.legs_pct), 1);
  return (
    <div>
      <div className="relative flex h-44 items-end gap-[3px] sm:gap-1" role="img" aria-label="Share of sets that were legs, by month.">
        <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted/50" style={{ bottom: `${(early / max) * 100}%` }} aria-hidden>
          <span className="absolute -top-4 right-0 text-[10.5px] text-muted">early avg {early}%</span>
        </div>
        {ms.map((m, i) => {
          const low = m.legs_pct < early / 2;
          return (
            <div key={m.month} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
              <div
                className={`w-full rounded-t-[3px] ${low ? "bg-red/80 group-hover:bg-red" : "bg-accent/80 group-hover:bg-accent"}`}
                style={{ height: `${(m.legs_pct / max) * 100}%`, minHeight: 2 }}
              />
              {m.legs_pct === 0 ? <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red">0</span> : null}
              <Tip align={i < 3 ? "left" : i > ms.length - 4 ? "right" : "center"}>
                <span className="text-muted">{fmtDate(m.month)}</span>
                <br />
                legs <b>{m.legs_pct}%</b> of {nf(m.sets)} sets
              </Tip>
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-[3px] text-[10px] text-dim sm:gap-1">
        {ms.map((m, i) => (
          <span key={m.month} className="flex-1 overflow-visible whitespace-nowrap text-center">
            {i % 3 === 0 ? fmtDate(m.month, m.month.endsWith("-01") || i === 0).replace(" 20", " ’") : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars: share of all sets by muscle group. */
export function GroupBars({ log }: { log: LiftLog }) {
  const max = Math.max(...log.groups.map((g) => g.share));
  return (
    <div className="space-y-2">
      {log.groups.map((g) => (
        <div key={g.group} className="grid grid-cols-[9ch_minmax(0,1fr)_5.5ch] items-center gap-3 text-[12.5px]">
          <span className={g.group === "Legs" ? "font-bold text-red" : "text-text"}>{g.group}</span>
          <div className="h-3 rounded-r-[3px] bg-line/60">
            <div className={`h-full rounded-r-[3px] ${g.group === "Legs" ? "bg-red/80" : "bg-accent/80"}`} style={{ width: `${(g.share / max) * 100}%` }} />
          </div>
          <span className="text-right tabular-nums text-muted">{g.share}%</span>
        </div>
      ))}
    </div>
  );
}

/** Sessions by weekday. */
export function DowBars({ log }: { log: LiftLog }) {
  const max = Math.max(...log.dow.map((d) => d.sessions), 1);
  const top = Math.max(...log.dow.map((d) => d.sessions));
  return (
    <div className="flex h-36 items-end gap-2" role="img" aria-label="Sessions by day of week.">
      {log.dow.map((d) => (
        <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[11px] tabular-nums text-muted">{d.sessions}</span>
          <div className={`w-full max-w-10 rounded-t-[4px] ${d.sessions === top ? "bg-accent" : "bg-accent/45"}`} style={{ height: `${(d.sessions / max) * 78}%`, minHeight: 2 }} />
          <span className="text-[11px] text-dim">{d.day}</span>
        </div>
      ))}
    </div>
  );
}
