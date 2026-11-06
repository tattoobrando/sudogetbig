import type { ReactNode } from "react";

export default function SectionHead({
  index,
  command,
  title,
  children,
}: {
  index: string;
  command: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 grid gap-4 md:mb-10 md:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] md:items-end">
      <div>
        <div className="mb-3 flex items-center gap-3 text-[12px] text-muted">
          <span className="text-accent">[{index}]</span>
          <span className="h-px w-8 bg-line-2" aria-hidden />
          <code className="truncate">
            <span className="text-dim">$</span> {command}
          </code>
        </div>
        <h2 className="display text-[2.1rem] uppercase text-text sm:text-5xl">{title}</h2>
      </div>
      {children ? <p className="max-w-md text-[14px] leading-relaxed text-muted md:justify-self-end">{children}</p> : null}
    </header>
  );
}
