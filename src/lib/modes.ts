export type Mode = "cut" | "bulk" | "dirty";

export const MODE_LABEL: Record<Mode, string> = {
  cut: "CUT",
  bulk: "BULK",
  dirty: "DIRTY BULK",
};
