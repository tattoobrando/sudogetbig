"use client";

import type { Command } from "../engine";
import { Bar, C, G, M, Pre, R, Y } from "../Out";
import { steps } from "./helpers";
import { asciiChart, compact, findings, findLift, fmtDate, legsTrend, LOG, nf, pct, solidLifts, sparkline } from "@/lib/lifts";

/* lifts [name]  ·  cat /var/log/gains.log */

const lifts: Command = {
  match: ["lifts"],
  aliases: [["gains-log"], ["liftlog"]],
  usage: "lifts [lift name]",
  summary: "root's real training log (or chart one lift)",
  group: "gains",
  async run(ctx) {
    const q = ctx.args.filter((a) => !a.startsWith("-")).join(" ");
    const t = LOG.totals;

    if (q) {
      const l = findLift(q);
      if (!l) {
        ctx.print(<R>lifts: no lift matching &quot;{q}&quot;</R>);
        ctx.print(<M>try: {solidLifts().slice(0, 6).map((x) => x.exercise.toLowerCase()).join(", ")}</M>);
        ctx.reject();
        return;
      }
      ctx.print(
        <span>
          <G className="font-bold">{l.exercise}</G>{" "}
          <M>
            · {l.group} · {l.series.length} sessions · {nf(l.sets)} sets
          </M>
        </span>,
      );
      ctx.print(
        <span>
          <M>est. 1RM</M> {nf(l.start)} → <b>{nf(l.recent)}</b> {LOG.units} <span className={l.change_pct >= 0 ? "text-accent" : "text-red"}>{pct(l.change_pct)}</span>
          <M> · best </M>
          <Y>{nf(l.best)}</Y>
          <M> on {fmtDate(l.best_date)}</M>
        </span>,
      );
      ctx.print(<Pre className="mt-1 text-accent">{asciiChart(l.series, 48, 8).join("\n")}</Pre>);
      ctx.print(
        <M>
          Interactive chart: <G>sudogetbig.com/lifts</G>
        </M>,
      );
      return;
    }

    await steps(ctx, ["Parsing Liftoff export", `Counting ${nf(t.sets)} sets`, "Locating leg day"], [180, 380]);
    const legs = legsTrend();
    ctx.print(
      <Pre>
        <G className="font-bold">{"sessions  "}</G>
        {nf(t.sessions)} ({t.per_week}/week, ~{t.avg_minutes ?? "?"} min){"\n"}
        <G className="font-bold">{"streak    "}</G>
        {t.current_streak} weeks current, {t.longest_streak} best{"\n"}
        <G className="font-bold">{"volume    "}</G>
        {compact(t.volume)} {LOG.units} · {nf(t.sets)} sets · {nf(t.reps)} reps{"\n"}
        <G className="font-bold">{"weekly    "}</G>
        <G>{sparkline(LOG.weekly.slice(-26).map((w) => w.sessions))}</G>
        <M> last 26 weeks</M>
        {"\n"}
        <G className="font-bold">{"legs      "}</G>
        <R>{sparkline(LOG.monthly.map((m) => m.legs_pct))}</R>
        <M>
          {" "}
          {legs.early}% → {legs.recent}% of sets
        </M>
      </Pre>,
    );
    ctx.print(<C className="mt-2 block font-bold tracking-wider">MUSCLE GROUPS</C>);
    const max = Math.max(...LOG.groups.map((g) => g.share));
    for (const g of LOG.groups)
      ctx.print(
        <span className="whitespace-pre">
          <span className={`inline-block w-[10ch] ${g.group === "Legs" ? "text-red" : ""}`}>{g.group}</span>
          <Bar pct={(g.share / max) * 100} width={16} tone={g.group === "Legs" ? "red" : "accent"} />
          <M> ({g.share}% of sets)</M>
        </span>,
      );
    ctx.print(<C className="mt-2 block font-bold tracking-wider">PROGRESSION</C>);
    ctx.print(
      <Pre>
        {solidLifts()
          .slice(0, 6)
          .map((l) => (
            <span key={l.exercise}>
              {(l.exercise.length > 28 ? l.exercise.slice(0, 27) + "…" : l.exercise).padEnd(29)}
              {String(l.start).padStart(4)} → <b>{String(l.recent).padStart(4)}</b>{" "}
              <span className={l.change_pct >= 0 ? "text-accent" : "text-red"}>{pct(l.change_pct).padStart(6)}</span>
              {"  "}
              <G>{sparkline(l.series.map(([, v]) => v), 14)}</G>
              {"\n"}
            </span>
          ))}
      </Pre>,
    );
    ctx.print(<C className="mt-1 block font-bold tracking-wider">FINDINGS</C>);
    for (const f of findings())
      ctx.print(
        <span>
          <Y>›</Y> {f}
        </span>,
      );
    ctx.print(
      <M className="mt-1 block">
        Chart one lift: <G>lifts leg press</G> · full dashboard: <G>sudogetbig.com/lifts</G> · terminal: <G>curl -L sudogetbig.com/lifts</G>
      </M>,
    );
  },
};

export const liftCommands: Command[] = [lifts];
