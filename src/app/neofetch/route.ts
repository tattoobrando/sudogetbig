import { columns, FIGURE, streamText } from "@/lib/cli";

export function GET(req: Request) {
  return streamText(req, async (o) => {
    const { p } = o;
    const info: [string, string][] = [
      ["OS", "SwoleOS 24.04 LTS (Long Term Swole) x86_64"],
      ["Host", "Absolute Unit 1.0 (migrated from Dad Bod v2.1)"],
      ["Kernel", "6.9.0-hypertrophy"],
      ["Uptime", "412 days (last rest day: disputed)"],
      ["Packages", "8 muscles (apt), 0 calves"],
      ["Shell", "protein-shake 5.2"],
      ["Terminal", "yours, apparently"],
      ["CPU", "Creatine Monohydrate @ 5g/day"],
      ["GPU", "Pre-Workout RTX 400mg"],
      ["Memory", "Muscle memory: permanent"],
    ];
    const right = [`${p.gb("gains")}@${p.gb("sudogetbig")}`, p.d("-".repeat(18)), ...info.map(([k, v]) => `${p.gb(k)}: ${v}`)];
    const art = FIGURE.map((l) => l.padEnd(28));
    columns(art, right, 28).forEach((l, i) => o.line(i < art.length ? p.g(l.slice(0, 28)) + l.slice(28) : l));
    o.line();
  });
}
