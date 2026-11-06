"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useGains } from "@/components/providers/GainsProvider";

const LINKS = [
  { href: "#terminal-section", label: "terminal" },
  { href: "#control-panel", label: "control panel" },
  { href: "#installer", label: "installer" },
  { href: "#modules", label: "modules" },
  { href: "#diagnostics", label: "diagnostics" },
];

export default function Nav() {
  const { openDocs, godMode } = useGains();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 border-b transition-colors ${scrolled ? "border-line bg-bg/90 backdrop-blur" : "border-transparent bg-transparent"}`}
      aria-label="Primary"
    >
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2 text-[14px] font-bold text-text">
          <span className="text-accent">$</span>
          <span>sudo get big</span>
          <span className="cursor h-[0.95em] w-[0.5em]" aria-hidden />
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:text-text">
              {l.label}
            </a>
          ))}
          <button type="button" onClick={() => openDocs()} className="rounded-md px-2.5 py-1.5 text-[12.5px] text-muted transition-colors hover:text-text">
            docs
          </button>
        </div>

        <div className="hidden items-center gap-2 text-[11.5px] text-muted lg:flex">
          <span className={`h-1.5 w-1.5 rounded-full ${godMode ? "bg-accent" : "bg-accent"} animate-pulse`} aria-hidden />
          gains.service <span className="text-accent">active (running)</span>
        </div>

        <button
          type="button"
          className="rounded-md border border-line-2 p-1.5 text-muted md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-bg px-4 pb-4 md:hidden">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block border-b border-line py-3 text-[14px] text-muted">
              <span className="text-dim">cd</span> {l.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openDocs();
            }}
            className="block w-full py-3 text-left text-[14px] text-muted"
          >
            <span className="text-dim">man</span> docs
          </button>
        </div>
      ) : null}
    </nav>
  );
}
