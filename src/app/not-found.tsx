import Link from "next/link";

export default function NotFound() {
  return (
    <main className="dotgrid flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-line-2 bg-[#070908]">
        <div className="border-b border-line bg-panel px-3 py-2 text-[12px] text-muted">bash — 404</div>
        <div className="space-y-1 p-5 text-[13.5px] leading-relaxed">
          <div>
            <span className="font-bold text-accent">gains</span>
            <span className="text-muted">@</span>
            <span className="font-bold text-accent">sudogetbig</span>
            <span className="text-muted">:</span>
            <span className="font-bold text-cyan">~</span>
            <span className="text-muted">$ </span>cd this-page
          </div>
          <div className="text-red">bash: cd: this-page: No such file or directory</div>
          <div className="text-muted">404: Gains not found. Neither are your calves.</div>
          <div className="pt-4">
            <Link href="/" className="inline-flex rounded-md bg-accent px-3 py-2 text-[13px] font-bold text-accent-ink">
              cd ~ (back to the terminal)
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
