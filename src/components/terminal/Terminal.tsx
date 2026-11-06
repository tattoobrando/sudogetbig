"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { CornerDownLeft, OctagonX } from "lucide-react";
import { useGains } from "@/components/providers/GainsProvider";
import { Aborted, complete, didYouMean, resolve, tokenize, type Ctx, type LineHandle, type ThemeName } from "./engine";
import { createFS } from "./fs";
import { COMMANDS, SUGGESTIONS } from "./commands";
import { B, G, M, Ok, R, Warn, Y } from "./Out";
import { pick } from "@/lib/random";
import { USERNAME_RE } from "@/lib/physique";

type Line = { id: number; node: ReactNode };

const MAX_LINES = 500;

const THEME_VARS: Record<ThemeName, CSSProperties> = {
  green: {},
  amber: { ["--accent" as string]: "#ffb547" },
  ice: { ["--accent" as string]: "#63d8ff" },
  mono: { ["--accent" as string]: "#dfe6e1" },
};

const NOT_FOUND = [
  "Have you tried lifting it?",
  "Not found in $PATH. Or in your training log.",
  "That package was deprecated along with your New Year's resolution.",
  "Your shell doesn't recognize it. Neither does your gym.",
  "Command rejected: insufficient protein.",
  "Segmentation fault (form breakdown).",
  "This command skipped leg day and could not stand up.",
];

/* The intro plays once, then hands the prompt to the visitor. */
const INTRO_STEPS = [
  "Authenticating gym membership...",
  "Installing progressive_overload...",
  "Mounting /dev/delts...",
  "Allocating additional muscle memory...",
  "Disabling excuses.service...",
];

function PromptLabel({ root, cwd }: { root: boolean; cwd: string }) {
  return (
    <span className="mr-[1ch] shrink-0 select-none">
      {root ? <span className="font-bold text-red">root</span> : <span className="font-bold text-accent">gains</span>}
      <span className="text-muted">@</span>
      <span className="font-bold text-accent">sudogetbig</span>
      <span className="text-muted">:</span>
      <span className="font-bold text-cyan">{cwd}</span>
      <span className="text-muted">{root ? "#" : "$"}</span>
    </span>
  );
}

export default function Terminal() {
  const gains = useGains();
  const reduced = useReducedMotion() ?? false;

  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [askPrompt, setAskPrompt] = useState<string | null>(null);
  const [trapPrompt, setTrapPrompt] = useState<string | null>(null);
  const [isRoot, setIsRoot] = useState(false);
  const [theme, setTheme] = useState<ThemeName>("green");
  const [cwd, setCwd] = useState("~");

  const idRef = useRef(0);
  const history = useRef<string[]>([]);
  const histIdx = useRef<number>(-1);
  const draft = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const askResolve = useRef<((v: string) => void) | null>(null);
  const trapRef = useRef<((line: string) => boolean | Promise<boolean>) | null>(null);
  const fsRef = useRef(createFS());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stick = useRef(true);
  const introRef = useRef<AbortController | null>(null);
  const gainsRef = useRef(gains);
  const rootRef = useRef(false);
  const reducedRef = useRef(reduced);

  useEffect(() => {
    gainsRef.current = gains;
    reducedRef.current = reduced;
  });

  /* ---------------- output primitives ---------------- */
  const print = useCallback((node: ReactNode): LineHandle => {
    const id = ++idRef.current;
    setLines((prev) => {
      const next = [...prev, { id, node }];
      return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
    });
    return {
      update: (n: ReactNode) => setLines((prev) => prev.map((l) => (l.id === id ? { id, node: n } : l))),
    };
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const makeSleep = useCallback(
    (signal: AbortSignal) => (ms: number) =>
      new Promise<void>((res, rej) => {
        if (signal.aborted) return rej(new Aborted());
        const t = setTimeout(res, reducedRef.current ? Math.min(ms, 40) * 0.25 : ms);
        signal.addEventListener("abort", () => {
          clearTimeout(t);
          rej(new Aborted());
        }, { once: true });
      }),
    [],
  );

  /* ---------------- autoscroll ---------------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [lines, askPrompt, trapPrompt]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  /* ---------------- execution ---------------- */
  const echo = useCallback(
    (cmd: string, root = rootRef.current) =>
      print(
        <div className="flex flex-wrap">
          <PromptLabel root={root} cwd={fsRef.current.display()} />
          <span className="break-all">{cmd}</span>
        </div>,
      ),
    [print],
  );

  const runLine = useCallback(
    async function runLine(line: string, nested = false): Promise<void> {
      const g = gainsRef.current;
      const raw = line.trim();
      if (!raw) return;
      const tokens = tokenize(raw);
      let r = resolve(tokens, COMMANDS);
      if (!r && tokens[0]?.toLowerCase() === "sudo") {
        const sudoCmd = COMMANDS.find((c) => c.match.length === 1 && c.match[0] === "sudo");
        if (sudoCmd) r = { cmd: sudoCmd, args: tokens.slice(1), sudo: true };
      }
      if (!nested) g.bump("commands");

      if (!r) {
        const first = tokens[0];
        const suggestion = didYouMean(raw, COMMANDS);
        print(
          <span>
            <R>bash: {first}: command not found.</R> <M>{pick(NOT_FOUND)}</M>
          </span>,
        );
        if (suggestion) print(<M>Did you mean: <G>{suggestion}</G>?</M>);
        g.bump("rejected");
        return;
      }

      const controller = abortRef.current ?? new AbortController();
      abortRef.current = controller;
      let rejected = false;

      const ctx: Ctx = {
        args: r.args,
        raw,
        sudo: r.sudo || rootRef.current,
        print,
        sleep: makeSleep(controller.signal),
        ask: (prompt) =>
          new Promise<string>((res, rej) => {
            if (controller.signal.aborted) return rej(new Aborted());
            setAskPrompt(prompt);
            askResolve.current = (v) => {
              askResolve.current = null;
              setAskPrompt(null);
              print(
                <span className="whitespace-pre-wrap">
                  {prompt}
                  {v}
                </span>,
              );
              res(v);
            };
            controller.signal.addEventListener("abort", () => {
              askResolve.current = null;
              setAskPrompt(null);
              rej(new Aborted());
            }, { once: true });
            requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
          }),
        clear,
        run: (l) => runLine(l, true),
        signal: controller.signal,
        history: history.current,
        fs: fsRef.current,
        isRoot: rootRef.current,
        setRoot: (v) => {
          rootRef.current = v;
          setIsRoot(v);
        },
        setTheme,
        setTrap: (trap, prompt) => {
          trapRef.current = trap;
          setTrapPrompt(trap ? prompt ?? ">" : null);
        },
        unlock: g.unlock,
        toast: g.toast,
        godMode: g.triggerGodMode,
        mode: g.mode,
        eggs: g.eggs,
        stats: g.stats,
        bump: g.bump,
        excusesKilled: g.excusesKilled,
        setExcusesKilled: g.setExcusesKilled,
        reduced: reducedRef.current,
        reject: () => {
          rejected = true;
        },
      };

      try {
        await r.cmd.run(ctx);
      } catch (e) {
        if (e instanceof Aborted) throw e;
        print(<R>Segmentation fault (core dumped). The command dropped the bar. Try again.</R>);
        console.error(e);
      } finally {
        if (rejected && !nested) g.bump("rejected");
        setCwd(fsRef.current.display());
      }
    },
    [clear, makeSleep, print],
  );

  const execute = useCallback(
    async (line: string) => {
      const raw = line;
      if (raw.trim()) {
        if (history.current[history.current.length - 1] !== raw.trim()) history.current.push(raw.trim());
      }
      histIdx.current = -1;
      draft.current = "";
      echo(raw);
      if (!raw.trim()) return;
      abortRef.current = new AbortController();
      setBusy(true);
      try {
        await runLine(raw);
      } catch (e) {
        if (e instanceof Aborted) print(<M>^C</M>);
      } finally {
        abortRef.current = null;
        setBusy(false);
        setAskPrompt(null);
        askResolve.current = null;
      }
    },
    [echo, print, runLine],
  );

  const abort = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  /* ---------------- intro sequence ---------------- */
  const printIntroStatic = useCallback(() => {
    clear();
    echo("sudo get big", false);
    print(<span>[sudo] password for gains: ********</span>);
    INTRO_STEPS.forEach((s) => print(<Ok>{s}</Ok>));
    print(<Warn>leg_day.service has not been started.</Warn>);
    print(<span><B>STATUS:</B> <G className="font-bold glow">MASSIVE PRIVILEGES GRANTED</G></span>);
    print(<M className="mt-2 block">Your turn. Type <G>help</G>, or try one of the commands below.</M>);
  }, [clear, echo, print]);

  const skipIntro = useCallback(() => {
    if (introRef.current && !introRef.current.signal.aborted) {
      introRef.current.abort();
      printIntroStatic();
    }
  }, [printIntroStatic]);

  useEffect(() => {
    const ctrl = new AbortController();
    introRef.current = ctrl;
    const sleep = makeSleep(ctrl.signal);
    (async () => {
      try {
        if (reducedRef.current) throw new Aborted();
        await sleep(500);
        const typed = "sudo get big";
        const h = print(<div className="flex"><PromptLabel root={false} cwd="~" /><span className="cursor" /></div>);
        for (let i = 1; i <= typed.length; i++) {
          await sleep(55 + Math.random() * 50);
          h.update(
            <div className="flex">
              <PromptLabel root={false} cwd="~" />
              <span>{typed.slice(0, i)}</span>
              <span className="cursor" />
            </div>,
          );
        }
        await sleep(250);
        h.update(<div className="flex"><PromptLabel root={false} cwd="~" /><span>{typed}</span></div>);
        const pw = print(<span>[sudo] password for gains: </span>);
        for (let i = 1; i <= 8; i++) {
          await sleep(60);
          pw.update(<span>[sudo] password for gains: {"*".repeat(i)}</span>);
        }
        await sleep(300);
        for (const s of INTRO_STEPS) {
          const l = print(<span><Y>…</Y> {s}</span>);
          await sleep(380 + Math.random() * 260);
          l.update(<Ok>{s}</Ok>);
        }
        await sleep(250);
        print(<Warn>leg_day.service has not been started.</Warn>);
        await sleep(400);
        print(<span><B>STATUS:</B> <G className="font-bold glow">MASSIVE PRIVILEGES GRANTED</G></span>);
        await sleep(300);
        print(<M className="mt-2 block">Your turn. Type <G>help</G>, or try one of the commands below.</M>);
        introRef.current = null;
      } catch (e) {
        if (e instanceof Aborted && !ctrl.signal.aborted) {
          // reduced motion: show the end state immediately
          introRef.current = null;
          printIntroStatic();
        }
      }
    })();
    return () => ctrl.abort();
  }, [makeSleep, print, printIntroStatic]);

  /* ---------------- external API (hero CTA, chips) ---------------- */
  const typeAndRun = useCallback(
    async (cmd: string) => {
      skipIntro();
      if (abortRef.current) {
        abortRef.current.abort();
        await new Promise((r) => setTimeout(r, 30));
      }
      trapRef.current = null;
      setTrapPrompt(null);
      stick.current = true;
      if (!reducedRef.current) {
        for (let i = 1; i <= cmd.length; i++) {
          setInput(cmd.slice(0, i));
          await new Promise((r) => setTimeout(r, 22));
        }
        await new Promise((r) => setTimeout(r, 120));
      }
      setInput("");
      void execute(cmd);
    },
    [execute, skipIntro],
  );

  const registerTerminal = gains.registerTerminal;
  useEffect(() => {
    registerTerminal({
      run: (cmd) => void typeAndRun(cmd),
      focus: () => inputRef.current?.focus({ preventScroll: true }),
    });
    return () => registerTerminal(null);
  }, [registerTerminal, typeAndRun]);

  // Shared links like sudogetbig.com/github/<user> land here as ?gh=<user> and run the report.
  useEffect(() => {
    const gh = new URLSearchParams(window.location.search).get("gh");
    if (!gh || !USERNAME_RE.test(gh)) return;
    window.history.replaceState(null, "", window.location.pathname);
    const t = setTimeout(() => {
      document.getElementById("terminal")?.scrollIntoView({ block: "center" });
      void typeAndRun(`sudo get big --github ${gh}`);
    }, 400);
    return () => clearTimeout(t);
  }, [typeAndRun]);

  /* ---------------- keyboard ---------------- */
  const onKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    skipIntro();
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key.toLowerCase() === "c") {
      if (busy) {
        e.preventDefault();
        abort();
      } else if (!window.getSelection()?.toString()) {
        e.preventDefault();
        echo(input + "^C");
        setInput("");
      }
      return;
    }
    if (ctrl && e.key.toLowerCase() === "l") {
      e.preventDefault();
      clear();
      return;
    }

    // While a command runs, only answers to prompts are accepted.
    if (busy && !askPrompt) {
      if (e.key === "q") {
        e.preventDefault();
        abort();
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const value = input;
      setInput("");
      if (askPrompt && askResolve.current) {
        askResolve.current(value);
        return;
      }
      if (trapRef.current) {
        echo(value);
        const handled = await trapRef.current(value);
        if (handled) return;
      }
      void execute(value);
      return;
    }

    if (askPrompt) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      if (histIdx.current === -1) draft.current = input;
      histIdx.current = histIdx.current === -1 ? h.length - 1 : Math.max(0, histIdx.current - 1);
      setInput(h[histIdx.current]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      if (histIdx.current === -1) return;
      histIdx.current += 1;
      if (histIdx.current >= h.length) {
        histIdx.current = -1;
        setInput(draft.current);
      } else setInput(h[histIdx.current]);
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      if (trapRef.current) return;
      const { value, options } = complete(input, COMMANDS, fsRef.current);
      if (options.length > 1) {
        echo(input);
        print(
          <div className="flex flex-wrap gap-x-5 text-muted">
            {options.slice(0, 40).map((o) => (
              <span key={o}>{o}</span>
            ))}
          </div>,
        );
      }
      setInput(value);
    }
  };

  const focusInput = () => {
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus({ preventScroll: true });
  };

  const runChip = (cmd: string) => void typeAndRun(cmd);

  const promptNode = useMemo(() => {
    if (askPrompt !== null) return <span className="shrink-0 whitespace-pre text-text">{askPrompt.split("\n").slice(-1)[0]}</span>;
    if (trapPrompt !== null) return <span className="shrink-0 font-bold text-amber">{trapPrompt}</span>;
    return <PromptLabel root={isRoot} cwd={cwd} />;
  }, [askPrompt, trapPrompt, isRoot, cwd]);

  const askHeader = askPrompt?.includes("\n") ? askPrompt.split("\n").slice(0, -1).join("\n") : null;

  return (
    <div id="terminal" className="relative" style={THEME_VARS[theme]}>
      <div className="overflow-hidden rounded-xl border border-line-2 bg-[#070908] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] transition-colors focus-within:border-accent/50">
        {/* title bar */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-panel px-3 py-2 text-[12px] text-muted">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-md border border-line-2 bg-bg px-2 py-0.5 text-text">bash</span>
            <span className="hidden truncate sm:inline">gains@sudogetbig: {cwd}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${busy ? "bg-amber" : "bg-accent"}`} />
              {busy ? (askPrompt ? "awaiting input" : "running") : "idle"}
            </span>
            <span className="select-none tracking-widest text-dim" aria-hidden>
              _ □ ×
            </span>
          </div>
        </div>

        {/* output */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          onClick={focusInput}
          className="term-scroll h-[440px] cursor-text overflow-y-auto px-4 py-3 text-[13px] leading-[1.55] sm:h-[480px] sm:text-[13.5px]"
        >
          <div role="log" aria-label="Terminal output" className="space-y-0.5 break-words">
            {lines.map((l) => (
              <div key={l.id}>{l.node}</div>
            ))}
          </div>
          {askHeader ? <div className="whitespace-pre-wrap">{askHeader}</div> : null}

          {/* input line */}
          <div className="flex flex-wrap items-center">
            {promptNode}
            <label htmlFor="term-input" className="sr-only">
              Terminal command
            </label>
            <input
              id="term-input"
              ref={inputRef}
              value={input}
              onChange={(e) => {
                skipIntro();
                setInput(e.target.value);
              }}
              onKeyDown={onKeyDown}
              readOnly={busy && !askPrompt}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="min-w-[8ch] flex-1 bg-transparent text-text caret-accent outline-none placeholder:text-dim focus-visible:outline-none"
              placeholder={busy && !askPrompt ? "" : lines.length > 3 ? "" : "type a command…"}
            />
          </div>
        </div>
      </div>

      {/* suggestions + mobile controls */}
      <div className="mt-3 flex items-center gap-2">
        {busy ? (
          <button
            type="button"
            onClick={abort}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-red/40 bg-red/10 px-2.5 py-1.5 text-[12px] text-red hover:bg-red/20"
          >
            <OctagonX size={14} aria-hidden /> Ctrl+C
          </button>
        ) : null}
        <div className="no-scrollbar -mx-1 flex flex-1 gap-2 overflow-x-auto px-1 py-0.5" role="list" aria-label="Suggested commands">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              role="listitem"
              type="button"
              onClick={() => runChip(s)}
              className="group flex shrink-0 items-center gap-1.5 rounded-md border border-line-2 bg-panel px-2.5 py-1.5 text-[12px] text-muted transition-colors hover:border-accent/60 hover:text-text"
            >
              <span className="text-accent">$</span> {s}
              <CornerDownLeft size={12} className="opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
