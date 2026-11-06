"use client";

import type { Command, Ctx } from "../engine";
import { B, Bar, C, G, M, Ok, Pre, R, Y } from "../Out";
import { steps } from "./helpers";
import { analyze, fetchGithub, GhError, ghErrorMessage, USERNAME_RE, type Physique } from "@/lib/physique";
import { copyText } from "@/lib/clipboard";

/* sudo get big --github <user>  ·  physique <user> */

function Report({ p }: { p: Physique }) {
  return (
    <div className="mt-1 space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <Pre className="text-accent">{p.art.join("\n")}</Pre>
        <div className="min-w-0 leading-[1.4]">
          <div>
            <G className="font-bold">{p.login}</G>
            {p.name ? <M> ({p.name})</M> : null}
            <M> @ github.com</M>
          </div>
          <div className="text-dim">{"-".repeat(Math.min(32, p.login.length + 14))}</div>
          {p.stats.map(([k, v]) => (
            <div key={k}>
              <G className="font-bold">{k}</G>: {v}
            </div>
          ))}
        </div>
      </div>

      {p.muscles.length ? (
        <div>
          <C className="font-bold tracking-wider">MUSCLE GROUPS</C>
          {p.muscles.map((m) => (
            <div key={m.language} className="grid gap-x-3 sm:grid-cols-[34ch_minmax(0,1fr)]">
              <Bar pct={m.share * 100} width={14} label={<span className="inline-block w-[10ch] truncate align-bottom">{m.language}</span>} />
              <span>
                <B>{m.muscle}</B> <M>— {m.note}</M>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        <C className="font-bold tracking-wider">FINDINGS</C>
        {p.roasts.map((r) => (
          <div key={r}>
            <Y>›</Y> {r}
          </div>
        ))}
      </div>

      <div className="border-t border-line-2 pt-2">
        <span className="display text-xl text-accent glow">{p.archetype.toUpperCase()}</span>
        <div>
          <B>Gains Index {p.gainsIndex}/100.</B> <M>{p.tagline}</M>
        </div>
      </div>
    </div>
  );
}

export function shareLink(login: string) {
  return `https://sudogetbig.com/github/${login}`;
}

export function shareText(p: Physique) {
  return [
    `$ sudo get big --github ${p.login}`,
    `${p.archetype} · Gains Index ${p.gainsIndex}/100`,
    p.roasts[0],
    `check yours: ${shareLink(p.login)}`,
  ].join("\n");
}

export async function runPhysique(ctx: Ctx, username: string) {
  if (!username) {
    ctx.print(<span>usage: sudo get big --github &lt;username&gt;</span>);
    ctx.print(<M>example: sudo get big --github octocat</M>);
    return;
  }
  const user = username.replace(/^@/, "").replace(/^https?:\/\/github\.com\//i, "").replace(/\/.*$/, "");
  if (!USERNAME_RE.test(user)) {
    ctx.print(<R>{ghErrorMessage(new GhError("invalid"), user)}</R>);
    ctx.reject();
    return;
  }

  const controller = new AbortController();
  ctx.signal.addEventListener("abort", () => controller.abort(), { once: true });
  ctx.print(<span>Connecting to <C>api.github.com</C> as an unauthenticated spotter…</span>);
  const fetching = fetchGithub(user, { signal: controller.signal });
  fetching.catch(() => {}); // handled below; avoids an unhandled rejection while the animation runs
  await steps(ctx, [`Pulling public profile for ${user}`, "Counting sets (pushes) and reps (commits)", "Measuring weekend attendance", "Mapping languages to muscle groups"], [180, 360]);

  let p: Physique;
  try {
    p = analyze(await fetching);
  } catch (e) {
    if (ctx.signal.aborted) throw e;
    ctx.print(<R>{ghErrorMessage(e, user)}</R>);
    ctx.reject();
    return;
  }

  ctx.print(<Report p={p} />);
  const ok = await copyText(shareText(p));
  ctx.print(
    <M>
      {ok ? "Copied a summary to your clipboard. " : ""}Share: <G>{shareLink(p.login)}</G> · terminal: <G>curl -L sudogetbig.com/github/{p.login}</G>
    </M>,
  );
  if (p.login.toLowerCase() !== user.toLowerCase()) ctx.print(<M>(GitHub says the username is actually {p.login})</M>);
  ctx.print(<Ok>Analysis complete. Results are scientifically meaningless and emotionally accurate.</Ok>);
}

export const physique: Command = {
  match: ["physique"],
  aliases: [["gitfit"], ["github"]],
  usage: "physique <github-user>",
  summary: "rate a GitHub profile's physique (same as sudo get big --github)",
  group: "dev",
  run(ctx) {
    return runPhysique(ctx, ctx.args.find((a) => !a.startsWith("-")) ?? "");
  },
};

export const githubCommands: Command[] = [physique];
