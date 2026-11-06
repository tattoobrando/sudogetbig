"use client";

import type { ReactNode } from "react";
import type { Ctx } from "../engine";
import { Bar, Ok, Spin } from "../Out";

/** Print each label with a spinner, then flip it to a check mark. */
export async function steps(ctx: Ctx, labels: ReactNode[], ms: [number, number] = [260, 620]) {
  for (const label of labels) {
    const h = ctx.print(<Spin>{label}</Spin>);
    await ctx.sleep(ms[0] + Math.random() * (ms[1] - ms[0]));
    h.update(<Ok>{label}</Ok>);
  }
}

/** Animated progress bar on a single line. */
export async function progress(
  ctx: Ctx,
  label: ReactNode,
  opts: { to?: number; from?: number; step?: [number, number]; tick?: number; tone?: "accent" | "amber" | "red" } = {},
) {
  const { to = 100, from = 0, step = [4, 13], tick = 70, tone } = opts;
  let pct = from;
  const h = ctx.print(<Bar pct={pct} label={label} tone={tone} />);
  while (pct < to) {
    await ctx.sleep(tick);
    pct = Math.min(to, pct + step[0] + Math.random() * (step[1] - step[0]));
    h.update(<Bar pct={pct} label={label} tone={tone} />);
  }
  return h;
}

/** Print lines one by one with a small delay. */
export async function lines(ctx: Ctx, list: ReactNode[], ms = 90) {
  for (const l of list) {
    ctx.print(l);
    await ctx.sleep(ms);
  }
}

/** Typewriter for a single line of text. */
export async function type(ctx: Ctx, text: string, render: (t: string) => ReactNode, ms = 28) {
  const h = ctx.print(render(""));
  for (let i = 1; i <= text.length; i++) {
    await ctx.sleep(ms);
    h.update(render(text.slice(0, i)));
  }
  return h;
}

export const yes = (answer: string) => answer.trim() === "" || /^y(es)?$/i.test(answer.trim());
