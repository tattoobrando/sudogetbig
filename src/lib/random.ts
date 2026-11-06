/** Small helpers for non-deterministic copy. Only call these from effects or event handlers, never during render. */
export const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

export const shuffle = <T,>(list: readonly T[]): T[] => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const sample = <T,>(list: readonly T[], n: number): T[] => shuffle(list).slice(0, n);

export const between = (min: number, max: number) => min + Math.random() * (max - min);
export const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1));

export const hex = (len = 7) =>
  Array.from({ length: len }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
