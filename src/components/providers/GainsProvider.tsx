"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig } from "motion/react";
import { EGGS, type EggId } from "@/lib/eggs";
import type { Mode } from "@/lib/modes";
import { readJSON, writeJSON } from "@/lib/storage";

export type ToastKind = "info" | "warn" | "alert" | "egg" | "ok";
export interface Toast {
  id: number;
  title: string;
  body?: string;
  kind: ToastKind;
}

export interface TerminalApi {
  /** Types the command into the hero terminal and runs it. */
  run: (cmd: string) => void;
  focus: () => void;
}

interface Stats {
  commands: number;
  rejected: number;
  installs: number;
}

interface GainsState {
  mode: Mode;
  setMode: (m: Mode) => void;
  eggs: EggId[];
  unlock: (id: EggId) => void;
  stats: Stats;
  bump: (k: keyof Stats, by?: number) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
  godMode: boolean;
  triggerGodMode: () => void;
  excusesKilled: boolean;
  setExcusesKilled: (v: boolean) => void;
  docsOpen: boolean;
  openDocs: (scroll?: boolean) => void;
  closeDocs: () => void;
  registerTerminal: (api: TerminalApi | null) => void;
  runInTerminal: (cmd: string) => void;
}

const Ctx = createContext<GainsState | null>(null);

export function useGains() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGains must be used inside <GainsProvider>");
  return v;
}

const EGG_KEY = "sudogetbig:eggs";

export function GainsProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("bulk");
  const [eggs, setEggs] = useState<EggId[]>([]);
  const [stats, setStats] = useState<Stats>({ commands: 0, rejected: 0, installs: 0 });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [godMode, setGodMode] = useState(false);
  const [excusesKilled, setExcusesKilled] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const terminal = useRef<TerminalApi | null>(null);
  const toastId = useRef(0);
  const godTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore found eggs after mount (keeps SSR and first client render identical).
  useEffect(() => {
    const t = setTimeout(() => {
      const saved = readJSON<string[]>(EGG_KEY, []).filter((e): e is EggId => e in EGGS);
      if (saved.length) setEggs(saved);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++toastId.current;
      setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
      setTimeout(() => dismiss(id), t.kind === "egg" ? 6500 : 5200);
    },
    [dismiss],
  );

  const eggsRef = useRef<EggId[]>([]);
  useEffect(() => {
    eggsRef.current = eggs;
  }, [eggs]);

  const unlock = useCallback(
    (id: EggId) => {
      if (eggsRef.current.includes(id)) return;
      const next = [...eggsRef.current, id];
      eggsRef.current = next;
      setEggs(next);
      writeJSON(EGG_KEY, next);
      toast({
        kind: "egg",
        title: `Easter egg found (${next.length}/${Object.keys(EGGS).length})`,
        body: EGGS[id],
      });
    },
    [toast],
  );

  const bump = useCallback((k: keyof Stats, by = 1) => {
    setStats((s) => ({ ...s, [k]: s[k] + by }));
  }, []);

  const triggerGodMode = useCallback(() => {
    setGodMode(true);
    document.documentElement.classList.add("god-mode");
    if (godTimer.current) clearTimeout(godTimer.current);
    godTimer.current = setTimeout(() => {
      setGodMode(false);
      document.documentElement.classList.remove("god-mode");
    }, 15000);
  }, []);

  const openDocs = useCallback((scroll = true) => {
    setDocsOpen(true);
    if (scroll) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.getElementById("docs")?.scrollIntoView({ block: "start" })),
      );
    }
  }, []);

  const closeDocs = useCallback(() => setDocsOpen(false), []);

  const registerTerminal = useCallback((api: TerminalApi | null) => {
    terminal.current = api;
  }, []);

  const runInTerminal = useCallback((cmd: string) => {
    document.getElementById("terminal")?.scrollIntoView({ block: "center" });
    terminal.current?.run(cmd);
  }, []);

  const value = useMemo<GainsState>(
    () => ({
      mode,
      setMode,
      eggs,
      unlock,
      stats,
      bump,
      toasts,
      toast,
      dismiss,
      godMode,
      triggerGodMode,
      excusesKilled,
      setExcusesKilled,
      docsOpen,
      openDocs,
      closeDocs,
      registerTerminal,
      runInTerminal,
    }),
    [
      mode, eggs, unlock, stats, bump, toasts, toast, dismiss, godMode, triggerGodMode,
      excusesKilled, docsOpen, openDocs, closeDocs, registerTerminal, runInTerminal,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </Ctx.Provider>
  );
}
