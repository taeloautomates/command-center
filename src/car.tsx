import * as React from "react";

/**
 * Car-seat + trunk illustrations and a labeled "task ball" primitive.
 *
 * This is the literal version of the front-seat / trunk metaphor — tasks are
 * 3D spheres, the front seat is an actual side-profile car seat with a
 * seatbelt across the ball, the trunk is an open carpeted compartment.
 *
 * Breaks from the rest of the dashboard's flat-glass aesthetic on purpose:
 * this surface is meant to feel like a creative board, not a corporate card.
 */

/** Reduce a title or project name to 1-3 uppercase initials for a ball label. */
export function ballLabel(input: { title: string; project?: string }): string {
  const src = input.project?.trim() || input.title.trim();
  if (!src) return "·";
  // Strip common decoration so initials come from real words.
  const cleaned = src
    .replace(/[@#]/g, "")
    .replace(/[—–\-_/]/g, " ")
    .replace(/[v]?\d+(\.\d+)*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length === 0) return src.slice(0, 2).toUpperCase();
  const initials = words.slice(0, 3).map((w) => w[0]).join("").toUpperCase();
  return initials.slice(0, 3) || "·";
}

/* ─── Task Ball ────────────────────────────────────────────────
   A 3D sphere with a short label inscribed. Used both as the MIT (in the
   seat) and as deferred tasks (in the trunk). Sizes are continuous so
   the same component renders the seat ball, trunk balls, and the
   "transit" ball when an item is being promoted. */

export function TaskBall({
  label, title, size = 56, tone = "default", onClick, onPointerDown, onRemove,
  animated, dragging, className = "",
}: {
  label: string;
  title?: string;
  size?: number;
  tone?: "default" | "active" | "ghost";
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onRemove?: () => void;
  animated?: boolean;
  dragging?: boolean;
  className?: string;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`cc-ball cc-ball-${tone}${animated ? " cc-ball-animated" : ""}${dragging ? " is-dragging" : ""} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.22) }}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onKeyDown={(e) => { if (onClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}
      title={title}
    >
      <span className="cc-ball-label">{label}</span>
      {onRemove && (
        <button
          className="cc-ball-remove"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Send to recycling"
          title="Remove from trunk"
        >×</button>
      )}
    </div>
  );
}

/* ─── Front Seat — racing bucket seat ──────────────────────────
   Side-3/4 profile of a bucket racing seat (Playseat-style): tall back with
   forward-wrapping headrest wings, side bolsters, deep cushion bolster,
   reclined angle. Mounted on a tubular frame with a hint of speed streaks
   behind it suggesting forward motion. */

export function FrontSeat({
  ballLabel, fullTitle, active, paused, done, isDropTarget, slotRef,
  onPointerDownBall, ballDragging,
}: {
  ballLabel: string;
  fullTitle: string;
  active: boolean;
  paused: boolean;
  done: boolean;
  isDropTarget?: boolean;
  slotRef?: React.RefObject<HTMLDivElement | null>;
  onPointerDownBall?: (e: React.PointerEvent) => void;
  ballDragging?: boolean;
}) {
  const buckled = active && !paused && !done;
  return (
    <div className={
      "cc-seat" +
      (buckled ? " buckled" : "") +
      (done ? " done" : "") +
      (isDropTarget ? " drop-target" : "")
    }>
      {/* Motion streaks behind the seat — implies forward movement */}
      <svg className="cc-seat-streaks" viewBox="0 0 200 200" aria-hidden="true" preserveAspectRatio="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1={4 + i * 4}
            x2={28 + i * 6}
            y1={40 + i * 14}
            y2={40 + i * 14}
            stroke={`rgba(255,255,255,${0.18 - i * 0.018})`}
            strokeWidth={i === 0 ? 1.2 : 0.8}
            strokeLinecap="round"
          />
        ))}
      </svg>

      <svg className="cc-seat-svg" viewBox="0 0 160 200" aria-hidden="true">
        <defs>
          <linearGradient id="cc-seat-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.07)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <linearGradient id="cc-seat-padding" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.4)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
          </linearGradient>
        </defs>

        {/* === Outer white SHELL of the bucket seat ===
           Side profile, slightly leaned back. Headrest wing wraps forward
           at top; backrest has tall side bolster; cushion has front bolster. */}
        <path
          d="
            M 96 6
            Q 80 6 76 18
            L 64 30
            Q 56 38 56 48
            L 56 70
            Q 38 88 50 132
            L 46 152
            Q 38 162 50 168
            L 134 168
            Q 144 168 144 158
            L 140 138
            Q 152 96 130 60
            L 124 44
            Q 124 30 116 22
            L 110 12
            Q 108 6 96 6 Z
          "
          fill="url(#cc-seat-shell)"
          stroke="rgba(255,255,255,0.44)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* === Inner DARK PADDING (the black fabric inset) === */}
        <path
          d="
            M 96 16
            Q 84 16 80 26
            L 70 38
            Q 64 44 64 54
            L 64 72
            Q 50 90 60 128
            L 58 148
            Q 52 156 60 160
            L 128 160
            Q 134 160 134 154
            L 132 138
            Q 140 100 122 70
            L 116 50
            Q 116 38 110 30
            L 106 22
            Q 104 16 96 16 Z
          "
          fill="url(#cc-seat-padding)"
        />

        {/* Quilted-pattern hint — three short horizontal dashes on the backrest */}
        <line x1="72" y1="60"  x2="116" y2="60"  stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" />
        <line x1="68" y1="78"  x2="120" y2="78"  stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" />
        <line x1="66" y1="96"  x2="122" y2="96"  stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" />
        <line x1="66" y1="114" x2="124" y2="114" stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" />

        {/* === Headrest wing detail === */}
        <path
          d="M 64 30 Q 56 38 56 48"
          fill="none"
          stroke="rgba(255,255,255,0.36)"
          strokeWidth="0.8"
        />
        {/* Tiny "PLAY" tag on headrest */}
        <rect x="84" y="24" width="22" height="5" rx="1"
          fill="rgba(255,255,255,0.18)"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="0.4"
        />

        {/* === Tubular FRAME under the seat === */}
        {/* Horizontal rail */}
        <rect x="22" y="170" width="124" height="6" rx="3"
          fill="rgba(255,255,255,0.10)"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth="1.2"
        />
        {/* Vertical frame struts (the angled posts) */}
        <line x1="56" y1="168" x2="44" y2="194" stroke="rgba(255,255,255,0.42)" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="116" y1="168" x2="128" y2="194" stroke="rgba(255,255,255,0.42)" strokeWidth="1.6" strokeLinecap="round" />
        {/* Base feet */}
        <rect x="34" y="192" width="22" height="5" rx="1.5"
          fill="rgba(255,255,255,0.10)"
          stroke="rgba(255,255,255,0.36)"
          strokeWidth="1"
        />
        <rect x="118" y="192" width="22" height="5" rx="1.5"
          fill="rgba(255,255,255,0.10)"
          stroke="rgba(255,255,255,0.36)"
          strokeWidth="1"
        />
      </svg>

      {/* The MIT ball — nests in the cushion bolster area */}
      <div className="cc-seat-ball-slot" ref={slotRef as React.RefObject<HTMLDivElement>}>
        <TaskBall
          label={ballLabel}
          title={fullTitle}
          size={64}
          tone={active && !paused ? "active" : "default"}
          animated
          onPointerDown={onPointerDownBall}
          dragging={ballDragging}
        />
        {/* Seatbelt — diagonal harness strap with buckle */}
        <svg className="cc-seatbelt" viewBox="0 0 80 80" aria-hidden="true">
          {/* Upper anchor — at top-left of ball */}
          <circle cx="6" cy="6" r="2.5" fill="rgba(255,255,255,0.62)" />
          {/* Strap */}
          <path
            d="M 6 6 L 74 70"
            stroke="rgba(255,255,255,0.62)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Buckle clasp near bottom-right */}
          <rect x="58" y="56" width="16" height="7" rx="1.5"
            fill="rgba(255,255,255,0.92)"
            stroke="rgba(255,255,255,1)"
            strokeWidth="0.6"
          />
          <line x1="62" y1="58" x2="62" y2="61" stroke="rgba(0,0,0,0.5)" strokeWidth="0.6" />
          <line x1="70" y1="58" x2="70" y2="61" stroke="rgba(0,0,0,0.5)" strokeWidth="0.6" />
        </svg>
      </div>
      {/* Title tag — small pill below the seat */}
      <div className="cc-seat-tag" title={fullTitle}>{fullTitle}</div>
    </div>
  );
}

/* ─── Drag-and-drop for task balls ────────────────────────────
   Pointer-based drag (same pattern as time-block stones). A trunk ball can
   be grabbed and dragged onto the seat slot to promote; the seat ball can
   be dragged onto the trunk to defer. The ghost follows the cursor and
   the drop target highlights while a ball is over it. */

export type BallDragState = {
  id: string;
  label: string;
  title: string;
  source: "trunk" | "seat";
  x: number;
  y: number;
} | null;

export function useBallDrag(opts: {
  seatRef: React.RefObject<HTMLDivElement | null>;
  trunkRef: React.RefObject<HTMLDivElement | null>;
  onDropOnSeat: (sourceId: string) => void;
  onDropOnTrunk: (sourceId: string) => void;
}) {
  const optsRef = React.useRef(opts);
  optsRef.current = opts;
  const [drag, setDrag] = React.useState<BallDragState>(null);
  const [hoverTarget, setHoverTarget] = React.useState<"seat" | "trunk" | null>(null);

  const startDrag = React.useCallback((args: {
    id: string; label: string; title: string; source: "trunk" | "seat";
  }, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag({ ...args, x: e.clientX, y: e.clientY });
  }, []);

  React.useEffect(() => {
    if (!drag) return;
    const within = (e: { clientX: number; clientY: number }, el: HTMLElement | null) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };
    const move = (e: PointerEvent) => {
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : null));
      const overSeat = within(e, optsRef.current.seatRef.current);
      const overTrunk = within(e, optsRef.current.trunkRef.current);
      setHoverTarget(overSeat ? "seat" : overTrunk ? "trunk" : null);
    };
    const up = (e: PointerEvent) => {
      const overSeat = within(e, optsRef.current.seatRef.current);
      const overTrunk = within(e, optsRef.current.trunkRef.current);
      if (overSeat && drag.source === "trunk") optsRef.current.onDropOnSeat(drag.id);
      else if (overTrunk && drag.source === "seat") optsRef.current.onDropOnTrunk(drag.id);
      setDrag(null);
      setHoverTarget(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag?.id]);

  return { drag, startDrag, hoverTarget };
}

export function BallGhost({ drag }: { drag: BallDragState }) {
  if (!drag) return null;
  return (
    <div style={{
      position: "fixed", left: drag.x, top: drag.y,
      transform: "translate(-50%, -50%)",
      pointerEvents: "none", zIndex: 9999,
    }}>
      <TaskBall label={drag.label} title={drag.title} size={drag.source === "seat" ? 64 : 52} tone="active" />
    </div>
  );
}

/* ─── Trunk ──────────────────────────────────────────────────
   An open-trunk compartment with a hinged "lid" line and a carpeted floor.
   Balls sit inside; the lid line angles up as if propped open. */

export function TrunkCompartment({
  children, count, trunkRef, isDropTarget,
}: {
  children: React.ReactNode;
  count: number;
  trunkRef?: React.RefObject<HTMLDivElement | null>;
  isDropTarget?: boolean;
}) {
  return (
    <div className="cc-trunk-wrap">
      <div className="cc-trunk-label">
        <span className="label">Trunk</span>
        <span className="mono tabular">{count} deferred</span>
      </div>
      <div
        className={"cc-trunk" + (isDropTarget ? " drop-target" : "")}
        ref={trunkRef as React.RefObject<HTMLDivElement>}
      >
        <svg className="cc-trunk-svg" viewBox="0 0 600 110" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <pattern id="cc-trunk-carpet" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
              <rect width="6" height="6" fill="rgba(255,255,255,0.012)" />
              <circle cx="1" cy="1" r="0.4" fill="rgba(255,255,255,0.05)" />
              <circle cx="4" cy="3" r="0.4" fill="rgba(255,255,255,0.04)" />
            </pattern>
          </defs>
          {/* Hinged lid — angled line up top, dashed for "propped open" */}
          <path
            d="M 8 14 Q 300 -4 592 14"
            fill="none"
            stroke="rgba(255,255,255,0.32)"
            strokeWidth="1.4"
            strokeDasharray="3 4"
          />
          <path
            d="M 6 18 L 6 30"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="1"
          />
          <path
            d="M 594 18 L 594 30"
            stroke="rgba(255,255,255,0.20)"
            strokeWidth="1"
          />
          {/* Trunk well — rounded rect floor */}
          <rect
            x="6" y="28" width="588" height="78" rx="10"
            fill="rgba(0,0,0,0.32)"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
          />
          <rect
            x="6" y="28" width="588" height="78" rx="10"
            fill="url(#cc-trunk-carpet)"
          />
          {/* Inner shadow at top to suggest depth */}
          <rect
            x="6" y="28" width="588" height="10"
            fill="url(#cc-trunk-shade)"
          />
          <defs>
            <linearGradient id="cc-trunk-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          </defs>
        </svg>

        <div className="cc-trunk-content">
          {children}
        </div>
      </div>
    </div>
  );
}
