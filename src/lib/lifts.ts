/* ------------------------------------------------------------------
   Lift log: the summarized Liftoff export (src/data/lifts.json, written
   by `npm run lifts` or the iPhone sync) bound to the helpers in
   liftsCore.ts. Shared by /lifts, the curl report and the terminal command.
   ------------------------------------------------------------------ */

import raw from "@/data/lifts.json";
import * as core from "./liftsCore";
import type { LiftLog, TrackedLift } from "./liftsCore";

export * from "./liftsCore";

export const LOG = raw as unknown as LiftLog;
export const TRACKED: TrackedLift[] = LOG.lifts.filter(core.isTracked);

export const legsTrend = (log: LiftLog = LOG) => core.legsTrend(log);
export const solidLifts = (log: LiftLog = LOG) => core.solidLifts(log);
export const findings = (log: LiftLog = LOG) => core.findings(log);
export const findLift = (q: string, lifts: TrackedLift[] = TRACKED) => core.findLift(q, lifts);
export const heatmap = (log: LiftLog = LOG, weeks?: number) => core.heatmap(log, weeks);
export const textHeatmap = (weeks = 52, log: LiftLog = LOG) => core.textHeatmap(log, weeks);
