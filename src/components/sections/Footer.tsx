"use client";

import { useGains } from "@/components/providers/GainsProvider";
import { EGG_COUNT } from "@/lib/eggs";

export default function Footer() {
  const { eggs, runInTerminal } = useGains();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <div className="display text-3xl uppercase text-text sm:text-4xl">
            sudo get <span className="text-accent">big</span>
          </div>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted">
            Powered by caffeine, creatine, and questionable decisions. A joke website. Not a fitness platform, not medical advice, and definitely
            not a substitute for eating vegetables.
          </p>
        </div>
        <div className="text-[13px]">
          <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-dim">try</div>
          <ul className="space-y-1.5">
            {["neofetch", "sudo systemctl start leg_day", "sudo apt remove cardio", "man gains"].map((c) => (
              <li key={c}>
                <button type="button" onClick={() => runInTerminal(c)} className="text-left text-muted hover:text-accent">
                  <span className="text-dim">$</span> {c}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-[13px] text-muted">
          <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-dim">status</div>
          <ul className="space-y-1.5">
            <li>
              easter eggs: <span className="text-text">{eggs.length}/{EGG_COUNT}</span>
            </li>
            <li>
              calves: <span className="text-red">404</span>
            </li>
            <li>
              leg_day: <span className="text-red">disabled</span>
            </li>
            <li>
              legal: <span className="text-text">unauthorized gains will be prosecuted</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-5 text-[11.5px] text-dim sm:flex-row sm:justify-between sm:px-6">
          <span>© sudogetbig.com · SwoleOS 24.04 LTS · this physique is still in beta</span>
          <span>
            built different · compiled incorrectly · <span className="text-muted">↑↑↓↓←→←→BA</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
