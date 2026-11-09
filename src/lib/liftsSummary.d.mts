import type { LiftLog } from "./lifts";

export class LiftoffError extends Error {}
export function parseCsv(text: string): Record<string, string>[];
export function summarize(csv: string, now?: Date): { log: LiftLog; unmapped: string[] };
