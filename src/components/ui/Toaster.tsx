"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Egg, Info, ShieldAlert, TriangleAlert, X } from "lucide-react";
import { useGains, type ToastKind } from "@/components/providers/GainsProvider";

const ICON: Record<ToastKind, typeof Info> = {
  info: Info,
  warn: TriangleAlert,
  alert: ShieldAlert,
  egg: Egg,
  ok: CheckCircle2,
};

const TONE: Record<ToastKind, string> = {
  info: "text-cyan",
  warn: "text-amber",
  alert: "text-red",
  egg: "text-accent",
  ok: "text-accent",
};

/* notify-send style popups, bottom right. */
export default function Toaster() {
  const { toasts, dismiss } = useGains();
  const reduced = useReducedMotion();
  return (
    <div
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[22rem]"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const I = ICON[t.kind];
          return (
            <motion.div
              key={t.id}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              role="status"
              className="pointer-events-auto flex w-full gap-3 rounded-lg border border-line-2 bg-panel/95 p-3 text-[12.5px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur"
            >
              <I size={16} className={`mt-0.5 shrink-0 ${TONE[t.kind]}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className={`font-bold ${TONE[t.kind]}`}>{t.title}</div>
                {t.body ? <div className="mt-0.5 text-muted">{t.body}</div> : null}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} className="h-fit rounded p-0.5 text-dim hover:text-text" aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
