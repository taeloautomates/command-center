import * as React from "react";

export function ProgressBar({
  value,
  max = 100,
  active = false,
  height = 2,
}: { value: number; max?: number; active?: boolean; height?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={"pbar" + (active ? " active" : "")} style={{ height }}>
      <i style={{ width: pct + "%" }} />
    </div>
  );
}

export function GlassCard({
  children,
  className = "",
  strong = false,
  soft = false,
  focus = false,
  onClick,
  style,
  clickable = false,
}: {
  children?: React.ReactNode;
  className?: string;
  strong?: boolean;
  soft?: boolean;
  focus?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  clickable?: boolean;
}) {
  const cls = ["glass"];
  if (strong) cls.push("glass-strong");
  if (soft) cls.push("glass-soft");
  if (focus) cls.push("focus-glow");
  if (clickable || onClick) cls.push("clickable");
  cls.push(className);
  return (
    <div className={cls.join(" ")} style={style} onClick={onClick}>
      {children}
    </div>
  );
}

export function Label({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="label" style={style}>{children}</div>;
}

export function Check({ on, onClick }: { on: boolean; onClick?: () => void }) {
  return (
    <span
      role="checkbox"
      aria-checked={on}
      tabIndex={0}
      className={"check" + (on ? " on" : "")}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onClick && onClick();
        }
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5.2 L4 7.5 L8.5 2.5" stroke="#0A0A0B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Dot({ idle = false, style }: { idle?: boolean; style?: React.CSSProperties }) {
  return <span className={"dot" + (idle ? " idle" : "")} style={style} />;
}

export function Row({
  children,
  gap = 8,
  align = "center",
  justify = "flex-start",
  style,
  className,
}: {
  children?: React.ReactNode;
  gap?: number;
  align?: React.CSSProperties["alignItems"];
  justify?: React.CSSProperties["justifyContent"];
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={className} style={{ display: "flex", alignItems: align, justifyContent: justify, gap, ...style }}>
      {children}
    </div>
  );
}

export function Col({
  children,
  gap = 8,
  style,
  className,
}: {
  children?: React.ReactNode;
  gap?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {children}
    </div>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />;
}
