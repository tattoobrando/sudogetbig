import { menu, streamText } from "@/lib/cli";

export function GET(req: Request) {
  return streamText(req, async (o) => {
    o.line(o.p.gb("sudogetbig.com") + o.p.m(" — root access to gains, from your actual terminal"));
    o.line();
    menu(o);
    o.line();
    o.line(o.p.m("flags: add ?plain for no colors/animation (good for piping)."));
  });
}
