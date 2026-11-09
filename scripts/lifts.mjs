#!/usr/bin/env node
/*
  Turns a Liftoff CSV export into src/data/lifts.json for /lifts.

    npm run lifts -- path/to/liftoff_workout_data.csv

  Only the summary is written (see src/lib/liftsSummary.mjs); the export
  itself stays on your machine. The iPhone Shortcut upload does the same
  thing server-side, so you only need this when updating by hand.
*/
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LiftoffError, summarize } from "../src/lib/liftsSummary.mjs";

const src = process.argv[2];
if (!src) {
  console.error("usage: npm run lifts -- path/to/liftoff_workout_data.csv");
  process.exit(1);
}
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src/data/lifts.json");

try {
  const { log, unmapped } = summarize(readFileSync(src, "utf8"));
  if (unmapped.length) console.warn("No muscle group for:", unmapped.join(", "), "(add a rule in src/lib/liftsSummary.mjs)");
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(log) + "\n");
  const t = log.totals;
  console.log(`wrote src/data/lifts.json: ${t.sessions} sessions, ${t.sets} sets, ${log.lifts.length} exercises, ${log.range.first} → ${log.range.last}`);
} catch (e) {
  console.error(e instanceof LiftoffError ? e.message : e);
  process.exit(1);
}
