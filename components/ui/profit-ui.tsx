import { cn } from "@/lib/cn";

/**
 * Shared visual-language primitives (Pro-Fit matte-black + electric-cyan),
 * reused across every app in the hub.
 */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[18px] border border-border bg-surface p-4", className)}
      {...props}
    />
  );
}

export function SectionTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Pill({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "accent" | "good" | "warn" | "danger";
}) {
  const tones = {
    default: "bg-surface-2 text-muted",
    accent: "bg-accent/[0.13] text-accent",
    good: "bg-good/[0.13] text-good",
    warn: "bg-warn/[0.14] text-warn",
    danger: "bg-danger/[0.13] text-danger",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {subtitle && <p className="max-w-xs text-sm text-muted">{subtitle}</p>}
    </div>
  );
}

/** Color for a 0–100 freshness/recovery value: spent → worked → ready → fresh. */
export function freshnessColor(value: number): string {
  if (value >= 80) return "var(--good)";
  if (value >= 50) return "var(--accent)";
  if (value >= 25) return "var(--warn)";
  return "var(--danger)";
}

/** Horizontal recovery / score / progress bar. */
export function Meter({ value, tone }: { value: number; tone?: string }) {
  const color = tone ?? freshnessColor(value);
  return (
    <div className="h-[7px] w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

/** Radial readiness gauge with a centered value + label. */
export function RadialGauge({
  value,
  label,
  size = 74,
  stroke = 7,
}: {
  value: number;
  label: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2 - 1;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const offset = c * (1 - v / 100);
  const color = freshnessColor(v);
  const center = size / 2;
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all"
        />
      </svg>
      <div className="text-center leading-none">
        <div className="font-mono text-[15px] font-medium">{Math.round(v)}</div>
        <div className="mt-0.5 text-[9px] text-muted">{label}</div>
      </div>
    </div>
  );
}

/** Compact KPI card — icon row + big mono value + caption. */
export function StatCard({
  label,
  value,
  caption,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  caption?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[15px] border border-border bg-surface p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted">
        {icon}
        {label}
      </div>
      <div className="font-mono text-[21px] font-medium leading-none">{value}</div>
      {caption && <div className="mt-1 text-[10px] text-muted">{caption}</div>}
    </div>
  );
}
