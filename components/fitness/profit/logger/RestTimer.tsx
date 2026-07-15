"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Pause, Play, X } from "lucide-react";
import { cn } from "@/lib/fitness/cn";

export interface RestTimerHandle {
  start: (seconds: number) => void;
}

export function RestTimer({ defaultSeconds = 120 }: { defaultSeconds?: number }) {
  const [total, setTotal] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((seconds: number) => {
    setTotal(seconds);
    setRemaining(seconds);
    setRunning(true);
  }, []);

  // Expose start() on window so set rows can trigger it without prop drilling.
  useEffect(() => {
    (window as unknown as { __restTimer?: RestTimerHandle }).__restTimer = { start };
    return () => {
      delete (window as unknown as { __restTimer?: RestTimerHandle }).__restTimer;
    };
  }, [start]);

  useEffect(() => {
    if (running && remaining > 0) {
      tick.current = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
      return () => {
        if (tick.current) clearInterval(tick.current);
      };
    }
    if (remaining === 0 && running) {
      setRunning(false);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(400);
    }
  }, [running, remaining]);

  if (remaining === 0 && !running) return null;

  const pct = total > 0 ? (remaining / total) * 100 : 0;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="fixed inset-x-0 bottom-[84px] z-40 mx-auto max-w-lg px-4">
      <div
        className="flex items-center gap-3 rounded-2xl border border-[#2a2f37] bg-surface-2 px-3.5 py-3"
        style={{ boxShadow: "0 16px 40px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(43,229,255,0.18)" }}
      >
        <div className="flex flex-col leading-none">
          <span className="mb-0.5 text-[10px] uppercase tracking-[0.1em] text-muted">Rest</span>
          <span className="font-mono text-[22px] font-medium text-accent">
            {mm}:{ss}
          </span>
        </div>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${pct}%`, boxShadow: "0 0 12px rgba(43,229,255,0.6)" }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn onClick={() => setRemaining((r) => r + 15)} label="+15s" wide>
            +15
          </IconBtn>
          <IconBtn onClick={() => setRunning((r) => !r)} label="toggle">
            {running ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          </IconBtn>
          <IconBtn
            onClick={() => {
              setRunning(false);
              setRemaining(0);
            }}
            label="dismiss"
          >
            <X size={14} strokeWidth={2.4} />
          </IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  wide = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  wide?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-8 items-center justify-center rounded-[9px] border border-border bg-surface font-mono text-xs text-foreground active:bg-border",
        wide ? "px-2.5" : "w-8 text-muted",
      )}
    >
      {children}
    </button>
  );
}

export function triggerRest(seconds: number) {
  (window as unknown as { __restTimer?: RestTimerHandle }).__restTimer?.start(seconds);
}
