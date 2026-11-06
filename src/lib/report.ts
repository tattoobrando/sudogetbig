import { EGG_COUNT } from "./eggs";
import { MODE_LABEL, type Mode } from "./modes";

export interface ReportInput {
  mode: Mode;
  eggs: number;
  stats: { commands: number; rejected: number; installs: number };
  excusesKilled: boolean;
}

function verdict({ eggs, stats }: ReportInput): string {
  if (eggs >= EGG_COUNT) return "Root access confirmed. Absolute unit. Please touch grass (barbell).";
  if (eggs >= 5) return "Built different. Compiled incorrectly.";
  if (stats.installs >= 3) return "Ran 'sudo get big' repeatedly. Gains do not stack. Optimism does.";
  if (stats.rejected > stats.commands / 2 && stats.commands > 4) return "Most commands rejected. This physique is still in beta.";
  if (stats.commands === 0) return "Hasn't typed a single command. Strong lurker energy. Weak everything else.";
  return "Intermediate lifter with advanced confidence.";
}

const MODE_NOTE: Record<Mode, string> = {
  cut: "CPU throttled, hunger daemon at 100%",
  bulk: "hypertrophy enabled, shirts at risk",
  dirty: "all safety protocols disabled",
};

/** Plain-text report, safe to paste into Discord, Slack, or a group chat. */
export function buildReport(input: ReportInput): string {
  const { mode, eggs, stats, excusesKilled } = input;
  const row = (k: string, v: string) => `${(k + ":").padEnd(14)}${v}`;
  return [
    "== GAINS SYSTEM REPORT ==",
    row("host", "sudogetbig.com"),
    row("user", "gains"),
    row("mode", `${MODE_LABEL[mode]} (${MODE_NOTE[mode]})`),
    row("commands", `${stats.commands} run, ${stats.rejected} rejected`),
    row("installs", `${stats.installs} (does not stack)`),
    row("excuses", excusesKilled ? "service stopped (will restart)" : "4812 running"),
    row("leg_day", "disabled since 2019"),
    row("calves", "404"),
    row("eggs", `${eggs}/${EGG_COUNT} found`),
    row("verdict", verdict(input)),
    "--",
    "get root access to your gains: https://sudogetbig.com",
  ].join("\n");
}
