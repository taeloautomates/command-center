import * as React from "react";

type IconProps = {
  children?: React.ReactNode;
  size?: number;
  stroke?: number;
  opacity?: number;
  style?: React.CSSProperties;
};

export const Icon = ({ children, size = 14, stroke = 1.4, opacity = 0.78, style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
    stroke={`rgba(255,255,255,${opacity})`} strokeWidth={stroke}
    strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

export const PauseIcon = (p: IconProps) => <Icon {...p}><line x1="6" y1="4" x2="6" y2="12" /><line x1="10" y1="4" x2="10" y2="12" /></Icon>;
export const PlayIcon  = (p: IconProps) => <Icon {...p}><path d="M5 3.5 L12 8 L5 12.5 Z" fill={`rgba(255,255,255,${p.opacity ?? 0.78})`} stroke="none" /></Icon>;
export const PlusIcon  = (p: IconProps) => <Icon {...p}><line x1="8" y1="3" x2="8" y2="13" /><line x1="3" y1="8" x2="13" y2="8" /></Icon>;
export const CheckIcon = (p: IconProps) => <Icon {...p}><polyline points="3 8.5 6.5 12 13 4.5" /></Icon>;
export const FocusIcon = (p: IconProps) => <Icon {...p}><circle cx="8" cy="8" r="5" /><circle cx="8" cy="8" r="1.5" fill={`rgba(255,255,255,${p.opacity ?? 0.78})`} stroke="none" /></Icon>;
export const YouTubeIcon = (p: IconProps) => <Icon {...p}><rect x="2" y="4" width="12" height="8" rx="2" /><path d="M7 6.5 L10.5 8 L7 9.5 Z" fill={`rgba(255,255,255,${p.opacity ?? 0.78})`} stroke="none" /></Icon>;
export const IGIcon = (p: IconProps) => <Icon {...p}><rect x="2.5" y="2.5" width="11" height="11" rx="3" /><circle cx="8" cy="8" r="2.5" /><circle cx="11.2" cy="4.8" r="0.6" fill={`rgba(255,255,255,${p.opacity ?? 0.78})`} stroke="none" /></Icon>;
export const TTIcon = (p: IconProps) => <Icon {...p}><path d="M9.5 2.5 L9.5 10.5 a3 3 0 1 1 -3 -3 M9.5 2.5 c0 1.5 1 3 3 3.2" /></Icon>;
export const LIIcon = (p: IconProps) => <Icon {...p}><rect x="2.5" y="2.5" width="11" height="11" rx="1.5" /><line x1="5" y1="7" x2="5" y2="11" /><circle cx="5" cy="5" r="0.6" fill={`rgba(255,255,255,${p.opacity ?? 0.78})`} stroke="none" /><path d="M7.5 7 L7.5 11 M7.5 8.5 a1.5 1.5 0 0 1 3 0 V11" /></Icon>;
export const SyncIcon = (p: IconProps) => <Icon {...p}><path d="M3 7 a5 5 0 0 1 9 -2 M13 9 a5 5 0 0 1 -9 2" /><polyline points="10 5 12 5 12 3" /><polyline points="6 11 4 11 4 13" /></Icon>;
export const AgentIcon = (p: IconProps) => <Icon {...p}><rect x="3" y="4" width="10" height="8" rx="2" /><circle cx="6" cy="8" r="0.8" fill={`rgba(255,255,255,${p.opacity ?? 0.78})`} stroke="none" /><circle cx="10" cy="8" r="0.8" fill={`rgba(255,255,255,${p.opacity ?? 0.78})`} stroke="none" /><line x1="8" y1="2.5" x2="8" y2="4" /></Icon>;
export const TerminalIcon = (p: IconProps) => <Icon {...p}><rect x="2" y="3" width="12" height="10" rx="1.5" /><polyline points="5 7 7 9 5 11" /><line x1="9" y1="11" x2="12" y2="11" /></Icon>;
