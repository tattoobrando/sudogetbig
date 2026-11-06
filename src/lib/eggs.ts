/** Hidden achievements. Keep ids stable — they're persisted in localStorage. */
export const EGGS = {
  vim: "Trapped in vim (and escaped)",
  rmroot: "Tried to rm -rf / without a spotter",
  shake: "Got root to make you a protein shake",
  sl: "Typo'd ls and saw the barbell",
  hack: "Hacked the gym",
  root: "Became root",
  stash: "Found the secret stash",
  bigger: "Asked for bigger",
  iddqd: "Remembered the old cheat code",
  konami: "Entered the Konami code",
} as const;

export type EggId = keyof typeof EGGS;
export const EGG_COUNT = Object.keys(EGGS).length;
