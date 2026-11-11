import type { Metadata } from "next";
import Link from "next/link";
import { DowBars, GroupBars, LegsBars, Panel, WeeklyBars } from "@/components/lifts/Charts";
import LiftExplorer from "@/components/lifts/LiftExplorer";
import Heatmap from "@/components/lifts/Heatmap";
import { compact, findings, fmtDate, legsTrend, LOG, nf, TRACKED } from "@/lib/lifts";

export const metadata: Metadata = {
  title: "Lift log",
  description: `Real training data, not a bit: ${LOG.totals.sessions} sessions, ${LOG.totals.current_streak}-week streak, and the slow, documented death of leg day.`,
  alternates: { canonical: "/lifts" },
};

export default function LiftsPage() {
  const t = LOG.totals;
  const legs = legsTrend();
  const notes = findings();
  const tiles: [string, string, string][] = [
    ["sessions", nf(t.sessions), `${fmtDate(LOG.range.first.slice(0, 7), false)} ’${LOG.range.first.slice(2, 4)} → ${fmtDate(LOG.range.last.slice(0, 7), false)} ’${LOG.range.last.slice(2, 4)}`],
    ["per week", String(t.per_week), `over ${Math.round(LOG.range.weeks)} weeks`],
    ["week streak", String(t.current_streak), t.current_streak === t.longest_streak ? "current = all-time best" : `best ${t.longest_streak}`],
    ["volume moved", compact(t.volume), `${LOG.units} (weight × reps)`],
    ["sets", nf(t.sets), `${nf(t.reps)} reps`],
    ["avg session", t.avg_minutes ? `${t.avg_minutes}m` : "—", `${t.exercises} different lifts`],
  ];

  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 sm:px-6">
      <header>
        <Link href="/" className="text-[12.5px] text-muted hover:text-accent">
          ← sudogetbig.com
        </Link>
        <p className="mt-6 text-[13px]">
          <span className="text-accent">root@sudogetbig</span>
          <span className="text-muted">:</span>
          <span className="text-cyan">~</span>
          <span className="text-muted">$ </span>
          cat /var/log/gains.log
        </p>
        <h1 className="display mt-3 text-[clamp(2.6rem,9vw,5.5rem)] text-text">
          LIFT <span className="text-accent glow">LOG</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-muted">
          Not a bit. This is root&apos;s actual training history, exported from Liftoff: every set from {fmtDate(LOG.range.first)} to{" "}
          {fmtDate(LOG.range.last)}. Uptime is excellent. Legs are{" "}
          <span className="text-red">{legs.recent}% of sets</span> lately, down from {legs.early}%. Nobody is surprised.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map(([k, v, sub]) => (
          <div key={k} className="bg-panel p-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-dim">{k}</div>
            <div className="mt-1 text-[clamp(1.5rem,3.4vw,2rem)] font-bold leading-none tabular-nums text-text">{v}</div>
            <div className="mt-1.5 text-[11.5px] text-muted">{sub}</div>
          </div>
        ))}
      </div>

      {notes.length ? (
        <section className="mt-4 rounded-xl border border-line bg-panel p-4 sm:p-5">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-cyan">findings</h2>
          <ul className="mt-2 space-y-1 text-[13px] leading-relaxed">
            {notes.map((n) => (
              <li key={n}>
                <span className="text-amber">›</span> {n}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Panel
        id="calendar"
        title="git log --graph"
        kicker="Every training day since the first export, one square per day. Darker = more sets. Looks like a commit history because it is one."
        className="mt-4"
      >
        <Heatmap />
      </Panel>

      <Panel id="progression" title="progression" kicker="Estimated one-rep max over time for every lift tracked on 4 or more days." className="mt-4">
        <LiftExplorer lifts={TRACKED} units={LOG.units} lastDay={LOG.range.last} />
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="attendance" kicker={<>Sessions per week. <span className="text-red">Red</span> = a week with zero.</>}>
          <WeeklyBars log={LOG} />
        </Panel>
        <Panel title="schedule" kicker="Sessions by day of the week.">
          <DowBars log={LOG} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="leg_day.service" kicker={<>Share of each month&apos;s sets that hit legs. Dashed line = the first six months&apos; average.</>}>
          <LegsBars log={LOG} early={legs.early} />
        </Panel>
        <Panel title="muscle groups" kicker="Share of all sets.">
          <GroupBars log={LOG} />
        </Panel>
      </div>

      <section className="mt-6 grid gap-4 text-[12.5px] leading-relaxed text-muted sm:grid-cols-2">
        <div className="rounded-xl border border-line p-4">
          <h2 className="mb-1 text-[11px] uppercase tracking-[0.14em] text-dim">also in a real terminal</h2>
          <code className="text-accent">ssh gains.sudogetbig.com</code> <span className="text-dim">(full app, no password)</span>
          <br />
          <code className="text-accent">curl -L sudogetbig.com/lifts</code>
          <br />
          <code className="text-accent">curl -L &quot;sudogetbig.com/lifts?lift=leg press&quot;</code>
          <br />
          or type <code className="text-accent">lifts</code> in the terminal on the{" "}
          <Link href="/#terminal-section" className="text-text underline decoration-line-2 underline-offset-2 hover:text-accent">
            homepage
          </Link>
          .
        </div>
        <div className="rounded-xl border border-line p-4">
          <h2 className="mb-1 text-[11px] uppercase tracking-[0.14em] text-dim">how the numbers work</h2>
          Weights in {LOG.units}. Estimated 1RM uses the Epley formula on sets of 1–15 reps. &ldquo;Start&rdquo; and &ldquo;recent&rdquo; average the first and last few
          sessions so one great or awful day doesn&apos;t skew it. Muscle groups are guessed from exercise names. Last updated {fmtDate(LOG.generated)}.
        </div>
      </section>
    </main>
  );
}
