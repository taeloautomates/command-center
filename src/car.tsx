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

      {/*
        Racing bucket seat — clean side profile, drawn like a Sparco/PRS1
        icon. We see the seat from the right side: tall reclined backrest
        on the left, horizontal cushion on the bottom-right, frame below.
        Bold strokes, real fills, no perspective tricks. This is meant to
        read as a seat in a single glance.
      */}
      <svg className="cc-seat-svg" viewBox="0 0 200 220" aria-hidden="true">
        <defs>
          <linearGradient id="cc-seat-back-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.22)" />
          </linearGradient>
          <linearGradient id="cc-seat-cushion-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="rgba(255,255,255,0.20)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
          </linearGradient>
          <linearGradient id="cc-seat-inset" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="rgba(0,0,0,0.55)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.30)" />
          </linearGradient>
          <linearGradient id="cc-seat-frame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="rgba(255,255,255,0.32)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
          </linearGradient>
        </defs>

        {/* ─── BACKREST ─────────────────────────────────────────
           Tall reclined back. Outer silhouette is a single bold closed
           path. Reclines ~10° from vertical, tallest at the top with the
           headrest cap rounded forward. */}
        <path
          d="
            M 96 12
            Q 70 12 64 30
            L 50 70
            Q 42 100 50 140
            L 60 168
            Q 64 178 78 178
            L 138 178
            Q 152 178 152 168
            L 152 158
            Q 138 152 130 144
            L 124 130
            Q 120 100 124 70
            L 120 38
            Q 116 18 100 14
            Q 98 12 96 12 Z
          "
          fill="url(#cc-seat-back-fill)"
          stroke="rgba(255,255,255,0.78)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Inset shadow inside the backrest — dark center where the
           seat's padding recesses. Makes the silhouette read as 3D. */}
        <path
          d="
            M 96 24
            Q 80 24 76 38
            L 68 70
            Q 62 100 68 138
            L 74 162
            Q 78 168 88 168
            L 132 168
            Q 138 168 136 160
            L 130 144
            Q 116 100 116 70
            L 110 42
            Q 106 28 96 24 Z
          "
          fill="url(#cc-seat-inset)"
        />

        {/* Center stitching — bold paired seams visible against the dark inset */}
        <line x1="88"  y1="34" x2="88"  y2="162"
          stroke="rgba(255,255,255,0.42)" strokeWidth="0.8" strokeDasharray="2.5 3" />
        <line x1="108" y1="34" x2="108" y2="162"
          stroke="rgba(255,255,255,0.42)" strokeWidth="0.8" strokeDasharray="2.5 3" />

        {/* Lumbar horizontal seam — where the back panel folds */}
        <line x1="74" y1="100" x2="124" y2="100"
          stroke="rgba(255,255,255,0.32)" strokeWidth="0.8" strokeDasharray="2 3" />

        {/* Headrest brand tag — small horizontal pill */}
        <rect x="86" y="34" width="22" height="4" rx="1"
          fill="rgba(255,255,255,0.42)"
          stroke="rgba(255,255,255,0.62)" strokeWidth="0.4" />

        {/* ─── CUSHION ──────────────────────────────────────────
           Wide bowl-shaped cushion below the backrest. Side bolsters
           rise up and meet the back. The MIT ball nests in the bowl. */}
        <path
          d="
            M 56 172
            L 152 172
            Q 162 172 162 184
            L 162 198
            Q 160 206 150 206
            L 58 206
            Q 48 206 46 198
            L 46 184
            Q 46 172 56 172 Z
          "
          fill="url(#cc-seat-cushion-fill)"
          stroke="rgba(255,255,255,0.78)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Dark inset on the cushion — the bowl where the ball nests */}
        <path
          d="
            M 70 180
            L 138 180
            Q 144 180 144 188
            L 144 196
            Q 144 200 138 200
            L 70 200
            Q 64 200 64 196
            L 64 188
            Q 64 180 70 180 Z
          "
          fill="url(#cc-seat-inset)"
        />

        {/* Cushion stitching */}
        <line x1="88"  y1="184" x2="88"  y2="200"
          stroke="rgba(255,255,255,0.42)" strokeWidth="0.8" strokeDasharray="2 3" />
        <line x1="108" y1="184" x2="108" y2="200"
          stroke="rgba(255,255,255,0.42)" strokeWidth="0.8" strokeDasharray="2 3" />

        {/* ─── FRAME ────────────────────────────────────────────
           Black aluminum-extrusion rail like the GT Elite reference.
           Horizontal slotted bar + two angled struts + base feet. */}

        {/* Horizontal main rail */}
        <rect x="32" y="210" width="138" height="6" rx="1"
          fill="url(#cc-seat-frame)"
          stroke="rgba(255,255,255,0.62)" strokeWidth="1.0" />
        {/* Slot groove */}
        <line x1="36" y1="213" x2="166" y2="213"
          stroke="rgba(0,0,0,0.5)" strokeWidth="0.6" />

        {/* Vertical mounting posts from cushion to rail */}
        <rect x="58" y="205" width="3" height="8"
          fill="rgba(255,255,255,0.32)" />
        <rect x="142" y="205" width="3" height="8"
          fill="rgba(255,255,255,0.32)" />

        {/* Tilt-adjuster knob on the right side of the cushion */}
        <circle cx="155" cy="186" r="4"
          fill="rgba(255,255,255,0.22)"
          stroke="rgba(255,255,255,0.78)" strokeWidth="1.0" />
        <circle cx="155" cy="186" r="1.4" fill="rgba(255,255,255,0.86)" />
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
