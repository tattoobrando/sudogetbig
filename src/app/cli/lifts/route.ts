import { bar, streamText } from "@/lib/cli";
import { asciiChart, compact, HEAT_CHARS, textHeatmap, findings, findLift, fmtDate, legsTrend, LOG, nf, pct, solidLifts, sparkline, TRACKED } from "@/lib/lifts";

/*
  curl -L sudogetbig.com/lifts            the whole log
  curl -L "sudogetbig.com/lifts?lift=leg press"   one lift, charted
  (the proxy rewrites CLI requests for /lifts here; browsers get the page)
*/
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("lift")?.slice(0, 60) ?? "";

  return streamText(req, async (o) => {
    const { p } = o;
    const t = LOG.totals;
    const cmd = o.opts.powershell ? "curl.exe" : "curl";
    o.line();
    await o.typeLine(p.g("root@sudogetbig") + p.m(":") + p.c("~") + p.m("$ "), q ? `gains-log --lift "${q}"` : "cat /var/log/gains.log", 30);
    await o.sleep(150);

    if (q) {
      const l = findLift(q);
      if (!l) {
        o.line(p.r(`gains-log: no lift matching "${q}"`));
        o.line(p.m("tracked lifts include: ") + solidLifts().slice(0, 8).map((x) => x.exercise).join(", "));
        o.line();
        o.line(p.m(`full list: ${cmd} -L sudogetbig.com/lifts`));
        o.line();
        return;
      }
      o.line();
      o.line(`${p.gb(l.exercise)} ${p.m(`· ${l.group} · ${l.series.length} sessions · ${nf(l.sets)} sets`)}`);
      o.line();
      o.line(`  ${p.m("est. 1RM")}   ${nf(l.start)} → ${p.b(nf(l.recent))} ${LOG.units}   ${(l.change_pct >= 0 ? p.g : p.r)(pct(l.change_pct))}`);
      o.line(`  ${p.m("best")}       ${p.y(nf(l.best))} ${p.m(`on ${fmtDate(l.best_date)}`)}`);
      o.line(`  ${p.m("heaviest")}   ${l.heaviest.replace(" x ", ` ${LOG.units} × `)} ${p.m("reps")}`);
      o.line();
      for (const row of asciiChart(l.series)) {
        const cut = row.indexOf("┤");
        if (cut > 0) o.line(p.d(row.slice(0, cut + 1)) + p.g(row.slice(cut + 1)));
        else o.line(p.d(row));
        await o.sleep(25);
      }
      o.line();
      o.line(p.d(`best estimated 1RM per session (Epley, sets of 1–15 reps). all lifts: ${cmd} -L sudogetbig.com/lifts`));
      o.line();
      return;
    }

    await o.step("Parsing Liftoff export", 350);
    await o.step(`Counting ${nf(t.sets)} sets`, 300);
    await o.step("Locating leg day", 500);
    o.line();

    const kv: [string, string][] = [
      ["range", `${fmtDate(LOG.range.first)} → ${fmtDate(LOG.range.last)} (${Math.round(LOG.range.weeks)} weeks)`],
      ["sessions", `${nf(t.sessions)} (${t.per_week}/week, ~${t.avg_minutes ?? "?"} min each)`],
      ["streak", `${t.current_streak} weeks current, ${t.longest_streak} best`],
      ["volume", `${compact(t.volume)} ${LOG.units} moved · ${nf(t.sets)} sets · ${nf(t.reps)} reps`],
    ];
    for (const [k, v] of kv) o.line(`  ${p.gb(k.padEnd(9))} ${v}`);
    o.line();

    const hm = textHeatmap(52);
    o.line(p.c(p.b("GIT LOG --GRAPH")) + p.m(`  training days, last ${hm.weeks} weeks`));
    const shade = (lv: number) => {
      const ch = HEAT_CHARS[lv + 1];
      if (!o.opts.color) return ch;
      if (lv <= 0) return p.d(ch);
      return `\x1b[38;5;${[0, 22, 28, 35, 48][lv]}m${ch}\x1b[0m`;
    };
    o.line("      " + p.d(hm.months));
    for (const r of hm.rows) {
      o.line(`  ${p.d(r.label)} ${r.levels.map(shade).join("")}`);
      await o.sleep(40);
    }
    o.line(p.m(`      ${hm.trained} training days out of ${hm.span}   `) + p.d("· rest ") + [1, 2, 3, 4].map(shade).join("") + p.d(` more sets`));
    o.line();

    o.line(p.c(p.b("MUSCLE GROUPS")) + p.m("  share of all sets"));
    const max = Math.max(...LOG.groups.map((g) => g.share));
    for (const g of LOG.groups) {
      const label = g.group.padEnd(10);
      o.line(`  ${g.group === "Legs" ? p.r(label) : label}${bar(p, (g.share / max) * 100, 20)} ${String(g.share).padStart(5)}%`);
    }
    o.line();

    const legs = legsTrend();
    o.line(p.c(p.b("LEG_DAY.SERVICE")) + p.m("  legs share by month"));
    o.line("  " + p.r(sparkline(LOG.monthly.map((m) => m.legs_pct))) + p.m(`  ${legs.early}% early → ${legs.recent}% lately`));
    o.line();

    o.line(p.c(p.b("PROGRESSION")) + p.m("  est. 1RM, first sessions → recent"));
    const top = solidLifts().slice(0, 10);
    const w = Math.min(30, Math.max(...top.map((l) => l.exercise.length)));
    for (const l of top) {
      const name = l.exercise.length > w ? l.exercise.slice(0, w - 1) + "…" : l.exercise.padEnd(w);
      const change = pct(l.change_pct).padStart(6);
      o.line(
        `  ${name} ${String(l.start).padStart(4)} → ${p.b(String(l.recent).padStart(4))} ${(l.change_pct >= 0 ? p.g : p.r)(change)}  ${p.g(sparkline(l.series.map(([, v]) => v), 16))}`,
      );
      await o.sleep(30);
    }
    o.line(p.m(`  …and ${TRACKED.length - top.length} more. chart one: ${cmd} -L "sudogetbig.com/lifts?lift=leg press"`));
    o.line();

    o.line(p.c(p.b("FINDINGS")));
    for (const f of findings()) o.line(`  ${p.y("›")} ${f}`);
    o.line();
    o.line(p.m("interactive charts: ") + p.c("https://sudogetbig.com/lifts"));
    o.line();
  });
}
