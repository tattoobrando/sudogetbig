"use client";

import { motion } from "motion/react";
import { BookOpen, TerminalSquare } from "lucide-react";
import Terminal from "@/components/terminal/Terminal";
import { useGains } from "@/components/providers/GainsProvider";

export default function Hero() {
  const { runInTerminal, openDocs } = useGains();
  // Same props on server and client; <MotionConfig reducedMotion="user"> drops the movement when the OS asks for less motion.
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] as const },
  });

  return (
    <section id="top" className="relative">
      <div className="dotgrid pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden />
      <div className="relative mx-auto grid max-w-[1240px] gap-10 px-4 pb-16 pt-6 sm:px-6 md:pt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:pb-24">
        <div className="flex flex-col justify-center">
          <motion.p {...rise(0)} className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted sm:mb-6">
            <span className="rounded border border-line-2 px-1.5 py-0.5 text-accent">SwoleOS 24.04 LTS</span>
            <span>build 0x5ACE</span>
            <span className="hidden text-dim sm:inline">·</span>
            <span className="hidden sm:inline">unauthorized gains will be prosecuted</span>
          </motion.p>

          <motion.h1 {...rise(0.05)} className="display text-[3.1rem] uppercase text-text sm:text-[4.6rem] lg:text-[4.4rem] xl:text-[5.3rem]">
            Root
            <br />
            access
            <br />
            to <span className="text-accent glow">gains.</span>
          </motion.h1>

          <motion.p {...rise(0.12)} className="mt-6 max-w-md text-[15px] leading-relaxed text-muted sm:text-base">
            Your physique is running on limited privileges.{" "}
            <span className="text-text">It&apos;s time to escalate.</span>
          </motion.p>

          <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => runInTerminal("sudo get big --now")}
              className="group inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-3 text-[14px] font-bold text-accent-ink shadow-[0_0_0_1px_var(--accent),0_10px_30px_-10px_var(--accent)] transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <TerminalSquare size={16} aria-hidden />
              <span>
                <span className="opacity-60">$</span> sudo get big --now
              </span>
            </button>
            <button
              type="button"
              onClick={() => openDocs()}
              className="inline-flex items-center gap-2 rounded-lg border border-line-2 px-4 py-3 text-[14px] text-text transition-colors hover:border-accent/60"
            >
              <BookOpen size={16} aria-hidden /> View Documentation
            </button>
          </motion.div>

          <motion.dl {...rise(0.24)} className="mt-10 hidden max-w-md grid-cols-3 gap-4 border-t border-line pt-5 text-[12px] sm:grid">
            <div>
              <dt className="text-dim">license</dt>
              <dd className="text-text">GPL (Gains Public)</dd>
            </div>
            <div>
              <dt className="text-dim">supported</dt>
              <dd className="text-text">x86, ARM, not calves</dd>
            </div>
            <div>
              <dt className="text-dim">powered by</dt>
              <dd className="text-text">caffeine, creatine</dd>
            </div>
          </motion.dl>
        </div>

        <motion.div
          id="terminal-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.2, 0.7, 0.2, 1] }}
          className="min-w-0 scroll-mt-24"
        >
          <Terminal />
        </motion.div>
      </div>
    </section>
  );
}
