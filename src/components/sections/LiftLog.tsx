"use client";

import Link from "next/link";
import { ArrowRight, TerminalSquare } from "lucide-react";
import SectionHead from "@/components/ui/SectionHead";
import Heatmap from "@/components/lifts/Heatmap";
import { useGains } from "@/components/providers/GainsProvider";
import { compact, findLift, fmtDate, legsTrend, LOG, nf, pct, solidLifts, type TrackedLift } from "@/lib/lifts";

/* Homepage teaser for /lifts: the one section on the site that isn't a bit. */

function Spark({ lift }: { lift: TrackedLift }) {
  // bucket to ~24 points (max per bucket) so the trend reads instead of the noise
  const raw = lift.series.map(([, x]) => x);
  const n = Math.min(24, raw.length);
  const v = Array.from({ length: n }, (_, i) => Math.max(...raw.slice(Math.floor((i * raw.length) / n), Math.max(Math.floor((i * raw.length) / n) + 1, Math.floor(((i + 1) * raw.length) / n)))));
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const pts = v.map((x, i) => `${((i / Math.max(1, v.length - 1)) * 100).toFixed(1)},${(28 - ((x - lo) / (hi - lo || 1)) * 26).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function LiftLog() {
  const { runInTerminal } = useGains();
  const t = LOG.totals;
  const legs = legsTrend();
  // the three most-trained lifts that went up, plus leg press for honesty
  const ups = solidLifts().filter((l) => l.change_pct > 0).slice(0, 3);
  const press = findLift("leg press");
  const featured = press && !ups.includes(press) ? [...ups, press] : ups;

  const stats: [string, string, string, boolean?][] = [
    ["week streak", String(t.current_streak), t.current_streak === t.longest_streak ? "all-time best, still running" : `best ${t.longest_streak}`],
    ["sessions", nf(t.sessions), `${t.per_week}/week since ${fmtDate(LOG.range.first.slice(0, 7))}`],
    ["volume", compact(t.volume), `${LOG.units} moved, ${nf(t.sets)} sets`],
    ["legs, lately", `${legs.recent}%`, `of sets (was ${legs.early}%)`, true],
  ];

  return (
    <section id="lift-log" className="mx-auto max-w-[1240px] scroll-mt-20 px-4 py-20 sm:px-6 md:py-28">
      <SectionHead index="06" command="tail -f /var/log/gains.log" title={<>Proof of <span className="text-accent">work.</span></>}>
        Everything above is a bit. This isn&apos;t: root&apos;s actual training log, pulled from a Liftoff export. The leg day jokes are, regrettably, supported by the data.
      </SectionHead>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        {stats.map(([k, v, sub, bad]) => (
          <div key={k} className="bg-panel p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.14em] text-dim">{k}</div>
            <div className={`mt-1 text-[clamp(1.7rem,4vw,2.4rem)] font-bold leading-none tabular-nums ${bad ? "text-red" : "text-text"}`}>{v}</div>
            <div className="mt-1.5 text-[12px] text-muted">{sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-cyan">uptime</h3>
            <span className="text-[11.5px] text-dim">training days, last 26 weeks</span>
          </div>
          <div className="mt-4">
            <Heatmap weeks={26} compact />
          </div>
          <p className="mt-3 text-[12px] text-muted">
            <span className="text-accent">●</span> gains.service: active (running), {t.current_streak} weeks straight without a zero.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-panel p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-cyan">progression</h3>
            <span className="text-[11.5px] text-dim">est. 1RM, first sessions → recent</span>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {featured.map((l) => (
              <li key={l.exercise}>
                <Link href="/lifts#progression" className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-center gap-3 py-2.5 text-[13px] hover:bg-panel-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto]">
                  <span className="min-w-0">
                    <span className="block truncate text-text">{l.exercise}</span>
                    <span className="text-[11.5px] tabular-nums text-muted">
                      {nf(l.start)} → {nf(l.recent)} {LOG.units}
                    </span>
                  </span>
                  <Spark lift={l} />
                  <span className={`w-14 text-right font-bold tabular-nums ${l.change_pct >= 0 ? "text-accent" : "text-red"}`}>{pct(l.change_pct)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/lifts"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-[13.5px] font-bold text-accent-ink transition-transform hover:-translate-y-0.5"
        >
          Open the full lift log <ArrowRight size={16} />
        </Link>
        <button
          type="button"
          onClick={() => runInTerminal("lifts")}
          className="inline-flex items-center gap-2 rounded-md border border-line-2 px-4 py-2.5 text-[13.5px] text-text hover:border-accent hover:text-accent"
        >
          <TerminalSquare size={16} /> run <code>lifts</code> in the terminal
        </button>
        <code className="text-[12.5px] text-muted">
          <span className="text-dim">or:</span> <span className="text-accent">curl -L sudogetbig.com/lifts</span>
        </code>
      </div>
    </section>
  );
}
