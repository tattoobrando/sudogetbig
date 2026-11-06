import { streamText } from "@/lib/cli";
import { FORTUNES } from "@/lib/fortunes";

export function GET(req: Request) {
  return streamText(req, async (o) => {
    const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    o.line(o.p.v(f));
    o.line(o.p.d("  — /usr/games/fortune --swole"));
  });
}
