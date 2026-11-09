"use client";

import { useEffect, useRef, useState } from "react";
import { fmtDate, heatmap, LOG, type HeatCell, type LiftLog } from "@/lib/lifts";

/*
  GitHub-contributions-style grid: one square per day, Monday at the top.
  Scrolls horizontally on narrow screens and starts at the most recent week.
*/

const LEVEL_BG = [
  "bg-line/70", // rest day
  "bg-accent/25",
  "bg-accent/50",
  "bg-accent/75",
  "bg-accent",
];
const DOW = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
const WEEKDAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Heatmap({ log = LOG, weeks, compact = false }: { log?: LiftLog; weeks?: number; compact?: boolean }) {
  const { cols, cuts, trained, span } = heatmap(log, weeks);
  const scroller = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ cell: HeatCell; dow: number } | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const months = cols.map((c, i) => {
    const m = c[0].date.slice(0, 7);
    const prev = i ? cols[i - 1][0].date.slice(0, 7) : "";
    return m !== prev && (i > 0 || c[0].date.slice(8) <= "07") ? fmtDate(m, m.endsWith("-01") || i === 0).replace(" 20", " ’") : "";
  });
  const w = compact ? "w-[10px]" : "w-[11px] sm:w-[12px]";
  const size = compact ? "h-[10px] w-[10px]" : "h-[11px] w-[11px] sm:h-[12px] sm:w-[12px]";

  return (
    <div>
      <div ref={scroller} className="overflow-x-auto pb-1" onMouseLeave={() => setHover(null)}>
        <div className="inline-grid grid-cols-[auto_1fr]">
          <div className="sticky left-0 z-10 bg-panel" />
          <div className="flex gap-[3px] text-[10px] text-dim" aria-hidden>
            {cols.map((c, i) => (
              <div key={c[0].date} className={`${w} relative h-3.5 shrink-0`}>
                {months[i] ? <span className="absolute left-0 top-0 whitespace-nowrap">{months[i]}</span> : null}
              </div>
            ))}
          </div>
          <div className="sticky left-0 z-10 grid grid-rows-7 gap-[3px] bg-panel pr-1.5 text-[10px] leading-none text-dim" aria-hidden>
            {DOW.map((d, i) => (
              <span key={i} className="flex items-center">
                {d}
              </span>
            ))}
          </div>
          <div
            className="flex gap-[3px]"
            role="img"
            aria-label={`Training calendar: ${trained} training days out of ${span} between ${fmtDate(log.range.first)} and ${fmtDate(log.range.last)}.`}
          >
            {cols.map((c) => (
              <div key={c[0].date} className="grid grid-rows-7 gap-[3px]">
                {c.map((cell, dow) => (
                  <div
                    key={cell.date}
                    onMouseEnter={() => cell.level >= 0 && setHover({ cell, dow })}
                    className={`${size} rounded-[2px] ${cell.level < 0 ? "bg-transparent" : LEVEL_BG[cell.level]} ${
                      hover?.cell.date === cell.date ? "ring-1 ring-text" : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11.5px] text-muted">
        <span className="min-h-[1.2em] tabular-nums">
          {hover ? (
            <>
              <span className="text-text">
                {WEEKDAY[hover.dow]}, {fmtDate(hover.cell.date)}
              </span>{" "}
              · {hover.cell.sets ? `${hover.cell.sets} sets` : <span className="text-dim">rest day</span>}
            </>
          ) : (
            <>
              <span className="text-text">{trained}</span> training days out of {span}
            </>
          )}
        </span>
        <span className="flex items-center gap-1 text-dim" aria-label={`Shades: rest, up to ${cuts[0]}, ${cuts[1]}, ${cuts[2]}, more than ${cuts[2]} sets`}>
          rest
          {LEVEL_BG.map((c) => (
            <span key={c} className={`inline-block h-[10px] w-[10px] rounded-[2px] ${c}`} />
          ))}
          {cuts[2]}+ sets
        </span>
      </div>
    </div>
  );
}
