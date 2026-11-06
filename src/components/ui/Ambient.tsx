"use client";

import { useEffect, useRef } from "react";
import { useGains } from "@/components/providers/GainsProvider";
import { shuffle } from "@/lib/random";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

const ALERTS: { kind: "info" | "warn" | "alert"; title: string; body: string }[] = [
  { kind: "alert", title: "SECURITY ALERT", body: "Unauthorized curls detected in the squat rack." },
  { kind: "warn", title: "rest-timer", body: "Your rest period has exceeded 90 seconds. Scrolling detected." },
  { kind: "info", title: "Update available", body: "bench 102.5 kg is ready to install. Restart required (Monday)." },
  { kind: "warn", title: "Disk quota exceeded", body: "/dev/stomach is 98% full. You had seconds." },
  { kind: "info", title: "hydration.service", body: "Water is a dependency. You've had two coffees." },
  { kind: "alert", title: "Intrusion detected", body: "Someone is using your bench as a phone stand." },
];

/* Konami code + a few well-spaced ambient notifications. */
export default function Ambient() {
  const { triggerGodMode, unlock, toast } = useGains();
  const buf = useRef<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      buf.current = [...buf.current, k].slice(-KONAMI.length);
      if (KONAMI.every((x, i) => buf.current[i] === x)) {
        buf.current = [];
        unlock("konami");
        triggerGodMode();
        toast({ kind: "egg", title: "GOD MODE ENABLED", body: "Infinite gains for 15 seconds. Recovery is still mortal." });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [triggerGodMode, unlock, toast]);

  useEffect(() => {
    const queue = shuffle(ALERTS).slice(0, 3);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 35000;
    for (const a of queue) {
      timers.push(
        setTimeout(() => {
          if (document.visibilityState === "visible") toast(a);
        }, at),
      );
      at += 60000 + Math.random() * 30000;
    }
    return () => timers.forEach(clearTimeout);
  }, [toast]);

  return null;
}
