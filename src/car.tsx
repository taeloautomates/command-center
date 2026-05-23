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
      "cc-seat launch" +
      (buckled ? " buckled" : "") +
      (done ? " done" : "") +
      (isDropTarget ? " drop-target" : "")
    }>
      {/* Motion streaks behind the seat — long forward-fade lines that
         intensify when buckled. Sit behind the seat in 3D space so the
         perspective rotation makes them feel like genuine slipstream. */}
      <svg className="cc-seat-streaks" viewBox="0 0 240 220" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <linearGradient id="cc-streak-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.42)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.86)" />
          </linearGradient>
        </defs>
        {Array.from({ length: 14 }).map((_, i) => {
          const y = 30 + i * 12;
          const len = 60 + (i % 3) * 30;
          const opacity = 0.10 + (i % 4) * 0.05;
          return (
            <line
              key={i}
              x1={4}
              x2={4 + len}
              y1={y}
              y2={y}
              stroke="url(#cc-streak-fade)"
              strokeWidth={i % 5 === 0 ? 1.4 : 0.7}
              strokeLinecap="round"
              opacity={opacity * 6}
            />
          );
        })}
      </svg>

      <svg className="cc-seat-svg" viewBox="0 0 160 200" aria-hidden="true">
        <defs>
          <linearGradient id="cc-seat-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
          <linearGradient id="cc-seat-padding" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.62)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.4)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
          </linearGradient>
          <linearGradient id="cc-seat-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.32)" />
          </linearGradient>
        </defs>

        {/* === SLEEK aero shell ===
           Sharper, more aggressive silhouette: tall pinched headrest,
           forward-swept side bolster, narrow waist, wide cushion lip. */}
        <path
          d="
            M 100 4
            Q 76 4 72 16
            L 56 28
            Q 46 38 46 50
            L 48 72
            Q 32 92 44 134
            L 40 154
            Q 32 166 46 172
            L 138 172
            Q 150 172 150 160
            L 144 138
            Q 156 98 134 60
            L 126 42
            Q 126 26 116 18
            L 110 8
            Q 110 4 100 4 Z
          "
          fill="url(#cc-seat-shell)"
          stroke="url(#cc-seat-edge)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />

        {/* === Inner padding — slightly inset, hugs the new silhouette === */}
        <path
          d="
            M 100 14
            Q 84 14 80 24
            L 68 36
            Q 60 44 60 54
            L 60 74
            Q 48 92 56 130
            L 54 150
            Q 50 158 60 162
            L 132 162
            Q 138 162 138 156
            L 134 138
            Q 142 100 124 70
            L 118 50
            Q 118 36 110 28
            L 106 20
            Q 104 14 100 14 Z
          "
          fill="url(#cc-seat-padding)"
        />

        {/* Carbon-fiber weave hints — short paired strokes, not the old
           wide quilted dashes. Sleeker. */}
        {[60, 76, 92, 108, 124].map((y, i) => (
          <g key={i}>
            <line x1="64" y1={y} x2="100" y2={y - 2}
              stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
            <line x1="100" y1={y - 2} x2="134" y2={y}
              stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
          </g>
        ))}

        {/* Headrest accent — single bright line catches the light */}
        <line x1="86" y1="22" x2="118" y2="22"
          stroke="rgba(255,255,255,0.62)" strokeWidth="0.6" strokeLinecap="round" />

        {/* === Frame: thin, low-profile carbon rail === */}
        <rect x="30" y="174" width="108" height="4" rx="2"
          fill="rgba(255,255,255,0.16)"
          stroke="rgba(255,255,255,0.46)"
          strokeWidth="0.8"
        />
        {/* Forward-angled struts — lean toward the front to suggest motion */}
        <line x1="50" y1="172" x2="32" y2="194"
          stroke="rgba(255,255,255,0.46)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="124" y1="172" x2="140" y2="194"
          stroke="rgba(255,255,255,0.46)" strokeWidth="1.4" strokeLinecap="round" />
        {/* Tiny base pads */}
        <rect x="22" y="192" width="16" height="4" rx="1.5"
          fill="rgba(255,255,255,0.14)"
          stroke="rgba(255,255,255,0.38)" strokeWidth="0.8"
        />
        <rect x="134" y="192" width="16" height="4" rx="1.5"
          fill="rgba(255,255,255,0.14)"
          stroke="rgba(255,255,255,0.38)" strokeWidth="0.8"
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
  children, count, trunkRef, isDropTarget, onClose,
}: {
  children: React.ReactNode;
  count: number;
  trunkRef?: React.RefObject<HTMLDivElement | null>;
  isDropTarget?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className="cc-trunk-wrap cyborg">
      <div className="cc-trunk-label">
        <span className="label">Trunk</span>
        <span className="mono tabular">{count} deferred · open</span>
        {onClose && (
          <button
            type="button"
            className="cc-trunk-close"
            onClick={onClose}
            title="Close trunk"
            aria-label="Close trunk"
          >
            <span aria-hidden="true">▴</span>
            <span>close</span>
          </button>
        )}
      </div>
      <div
        className={"cc-trunk cyborg" + (isDropTarget ? " drop-target" : "")}
        ref={trunkRef as React.RefObject<HTMLDivElement>}
      >
        <svg className="cc-trunk-svg" viewBox="0 0 600 110" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            {/* Scan-line hex weave — gives the floor a tech texture without color */}
            <pattern id="cc-trunk-mesh" x="0" y="0" width="14" height="12" patternUnits="userSpaceOnUse">
              <path d="M 0 6 L 7 0 L 14 6 L 7 12 Z"
                fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="0.5" />
            </pattern>
            <linearGradient id="cc-trunk-rim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
            <linearGradient id="cc-trunk-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,0,0,0.65)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
            </linearGradient>
          </defs>

          {/* Chamfered (octagonal-ish) outer plate — angular, not rounded.
             Eight-sided shape: small diagonal cuts at every corner. */}
          <path
            d="M 14 8 L 586 8 L 596 18 L 596 92 L 586 102 L 14 102 L 4 92 L 4 18 Z"
            fill="url(#cc-trunk-floor)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
          />
          {/* Mesh overlay inside the chamfered plate */}
          <path
            d="M 14 8 L 586 8 L 596 18 L 596 92 L 586 102 L 14 102 L 4 92 L 4 18 Z"
            fill="url(#cc-trunk-mesh)"
          />

          {/* Top accent rail — the "glowing" edge of an opened cyborg trunk */}
          <rect x="14" y="6" width="572" height="2" fill="url(#cc-trunk-rim)" opacity="0.86" />
          {/* Notches at the corners suggesting machined hinges */}
          <rect x="14" y="8" width="6" height="6" fill="rgba(255,255,255,0.32)" />
          <rect x="580" y="8" width="6" height="6" fill="rgba(255,255,255,0.32)" />
          <rect x="14" y="96" width="6" height="6" fill="rgba(255,255,255,0.18)" />
          <rect x="580" y="96" width="6" height="6" fill="rgba(255,255,255,0.18)" />

          {/* Vertical scanlines — every 60px, very faint */}
          {[100, 200, 300, 400, 500].map((x) => (
            <line key={x} x1={x} y1="14" x2={x} y2="96"
              stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          ))}

          {/* Center status tick — pulses when isDropTarget */}
          <circle cx="300" cy="98" r="1.6" fill="rgba(255,255,255,0.62)" />
        </svg>

        <div className="cc-trunk-content">
          {children}
        </div>
      </div>
    </div>
  );
}
