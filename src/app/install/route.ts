import { INSTALL_SCRIPT } from "@/lib/installScript";

/* curl -sL sudogetbig.com/install | bash  — a harmless script that only prints text. */
export function GET() {
  return new Response(INSTALL_SCRIPT, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
