import * as React from "react";

export function Hourglass({
  remaining,
  total,
  active,
  paused,
  size = 100,
}: { remaining: number; total: number; active: boolean; paused: boolean; size?: number }) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const pour = 1 - ratio;
  const flowing = active && !paused && remaining > 0;

  const topInteriorTop = 6;
  const topInteriorBottom = 86;
  const topRange = topInteriorBottom - topInteriorTop;
  const yRim = topInteriorTop + (1 - ratio) * topRange;
  const dipDepth = 8 + (1 - ratio) * 28;
  const ySink = Math.min(yRim + dipDepth, topInteriorBottom - 1);

  const botInteriorTop = 96;
  const botInteriorBottom = 176;
  const botRange = botInteriorBottom - botInteriorTop;
  const yBase = botInteriorBottom - pour * (botRange - 4);
  const moundPeak = Math.max(8, 6 + pour * 6);
  const yPeak = Math.max(botInteriorTop + 2, yBase - moundPeak);

  const uid = React.useId();
  const id = (k: string) => `${uid}-${k}`.replace(/[:]/g, "");

  return (
    <div style={{
      position: "relative",
      width: size,
      height: size * (184 / 100),
      flexShrink: 0,
      filter: flowing ? "drop-shadow(0 4px 14px rgba(0,0,0,0.55))"
                      : "drop-shadow(0 3px 10px rgba(0,0,0,0.5))",
    }}>
      {flowing && (
        <div style={{
          position: "absolute",
          inset: -12,
          background: "radial-gradient(45% 55% at 50% 55%, rgba(255,200,160,0.10), rgba(255,255,255,0) 70%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }} />
      )}

      <svg viewBox="0 0 100 184" width={size} height={size * (184 / 100)}
        style={{ position: "relative", display: "block", overflow: "visible" }}>
        <defs>
          <filter id={id("grain")} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="3.2" numOctaves={2} seed={7} stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0.18
                                   0 0 0 0 0.12
                                   0 0 0 0 0.06
                                   0 0 0 0.55 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>

          <linearGradient id={id("sand")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8D2A8" />
            <stop offset="55%" stopColor="#D4B888" />
            <stop offset="100%" stopColor="#A88654" />
          </linearGradient>

          <linearGradient id={id("stream")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8D2A8" stopOpacity="0.0" />
            <stop offset="20%" stopColor="#E8D2A8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#C9A874" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id={id("glass")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
            <stop offset="42%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="58%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
          </linearGradient>

          <radialGradient id={id("topRim")} cx="50%" cy="50%" r="50%">
            <stop offset="70%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
          </radialGradient>
          <radialGradient id={id("botRim")} cx="50%" cy="55%" r="55%">
            <stop offset="70%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
          </radialGradient>

          <clipPath id={id("topClip")}>
            <circle cx="50" cy="46" r="42" />
          </clipPath>
          <clipPath id={id("botClip")}>
            <path d="M 47 94 C 47 96 48 98 50 99 C 52 98 53 96 53 94 C 70 100 92 118 92 148 C 92 168 74 178 50 178 C 26 178 8 168 8 148 C 8 118 30 100 47 94 Z" />
          </clipPath>
        </defs>

        <circle cx="50" cy="46" r="42" fill={`url(#${id("glass")})`} />
        <circle cx="50" cy="46" r="42" fill={`url(#${id("topRim")})`} />

        <path d="M 47 94 C 47 96 48 98 50 99 C 52 98 53 96 53 94 C 70 100 92 118 92 148 C 92 168 74 178 50 178 C 26 178 8 168 8 148 C 8 118 30 100 47 94 Z" fill={`url(#${id("glass")})`} />
        <path d="M 47 94 C 47 96 48 98 50 99 C 52 98 53 96 53 94 C 70 100 92 118 92 148 C 92 168 74 178 50 178 C 26 178 8 168 8 148 C 8 118 30 100 47 94 Z" fill={`url(#${id("botRim")})`} />

        {ratio > 0.001 && (
          <g clipPath={`url(#${id("topClip")})`}>
            <path d={`M -10 ${yRim} Q 50 ${ySink + 1} 110 ${yRim} L 110 200 L -10 200 Z`} fill={`url(#${id("sand")})`} />
            <path d={`M -10 ${yRim} Q 50 ${ySink + 1} 110 ${yRim} L 110 ${yRim + 4} L -10 ${yRim + 4} Z`} fill="rgba(0,0,0,0.18)" style={{ mixBlendMode: "multiply" }} />
            <path d={`M -10 ${yRim} Q 50 ${ySink + 1} 110 ${yRim}`} fill="none" stroke="rgba(255,245,220,0.85)" strokeWidth="0.6" />
            <path d={`M -10 ${yRim} Q 50 ${ySink + 1} 110 ${yRim} L 110 200 L -10 200 Z`} fill="#000" filter={`url(#${id("grain")})`} opacity="0.65" />
          </g>
        )}

        <path d="M 47 88 C 47 90 48 92 50 92.5 C 52 92 53 90 53 88 C 53 88 55 92 56 95 C 53 96 52 97.5 50 98 C 48 97.5 47 96 44 95 C 45 92 47 88 47 88 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.20)" strokeWidth="0.5" />

        {flowing && (
          <g clipPath={`url(#${id("botClip")})`}>
            <rect x="49.4" y="98" width="1.4" height={Math.max(0, yBase - 98 - 1)} fill={`url(#${id("stream")})`}>
              <animate attributeName="opacity" values="0.95;0.7;0.95" dur="0.6s" repeatCount="indefinite" />
            </rect>
          </g>
        )}
        {flowing && ratio > 0.001 && (
          <g clipPath={`url(#${id("topClip")})`}>
            {[0, 1, 2].map((i) => (
              <circle key={i} cx={49.6 + (i % 2) * 0.6} r="0.4" fill="#E8D2A8">
                <animate attributeName="cy" values={`${ySink - 1};${ySink + 2}`} dur={`${0.4 + i * 0.15}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur={`${0.4 + i * 0.15}s`} begin={`${i * 0.1}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        )}
        {flowing && (
          <g clipPath={`url(#${id("botClip")})`}>
            {[0, 1, 2, 3].map((i) => (
              <circle key={i} cx={49.5 + (i % 2) * 0.8} r="0.45" fill="#E8D2A8">
                <animate attributeName="cy" values={`98;${yBase - 1}`} dur={`${0.9 + i * 0.18}s`} begin={`${i * 0.18}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.88;1" dur={`${0.9 + i * 0.18}s`} begin={`${i * 0.18}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        )}

        {pour > 0.001 && (
          <g clipPath={`url(#${id("botClip")})`}>
            <path d={`M -10 ${yBase} Q 50 ${yPeak} 110 ${yBase} L 110 200 L -10 200 Z`} fill={`url(#${id("sand")})`} />
            <path d={`M -10 ${yBase} Q 50 ${yPeak} 110 ${yBase}`} fill="none" stroke="rgba(255,245,220,0.7)" strokeWidth="0.6" />
            {flowing && (
              <ellipse cx="50" cy={yPeak + 1.6} rx="3" ry="1" fill="rgba(0,0,0,0.25)" />
            )}
            <path d={`M -10 ${yBase} Q 50 ${yPeak} 110 ${yBase} L 110 200 L -10 200 Z`} fill="#000" filter={`url(#${id("grain")})`} opacity="0.65" />
          </g>
        )}

        <circle cx="50" cy="46" r="42" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.6" />
        <path d="M 47 94 C 47 96 48 98 50 99 C 52 98 53 96 53 94 C 70 100 92 118 92 148 C 92 168 74 178 50 178 C 26 178 8 168 8 148 C 8 118 30 100 47 94 Z" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />

        <path d="M 22 28 Q 14 42 18 60" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M 20 32 Q 17 40 21 52" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M 18 116 Q 10 138 16 160" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M 16 122 Q 13 138 18 154" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M 80 30 Q 84 42 80 52" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" strokeLinecap="round" />
        <path d="M 82 122 Q 88 142 82 158" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
