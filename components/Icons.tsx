interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const base = (size: number, color: string, sw: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

/* ---------- Navigation ---------- */

export function ChartIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <rect x="7" y="12" width="3" height="5" rx="1" />
      <rect x="12.5" y="8" width="3" height="9" rx="1" />
      <rect x="18" y="4.5" width="3" height="12.5" rx="1" />
    </svg>
  );
}

export function BoxIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
      <path d="M3.3 7L12 12l8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

export function TagIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.2" fill={color} stroke="none" />
    </svg>
  );
}

export function UsersIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function UserIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function StoreIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M4.5 11v8a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-8" />
      <path d="M9.5 20v-5h5v5" />
    </svg>
  );
}

/* ---------- Status / Actions ---------- */

export function SparkleIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
    </svg>
  );
}

export function WalletIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
      <path d="M21 12h-5a2 2 0 0 0 0 4h5v-4z" />
      <path d="M3 7h16" />
    </svg>
  );
}

export function TruckIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M2 6.5A1.5 1.5 0 0 1 3.5 5h9A1.5 1.5 0 0 1 14 6.5V16H2V6.5z" />
      <path d="M14 9h3.6a2 2 0 0 1 1.7.96L22 14.5V16h-8V9z" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="17.5" cy="18" r="2" />
      <path d="M8.5 18h7" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </svg>
  );
}

export function PhoneIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function MapPinIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/* ---------- UI Controls ---------- */

export function KanbanIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <rect x="3" y="3" width="5.5" height="13" rx="1.5" />
      <rect x="9.5" y="3" width="5.5" height="18" rx="1.5" />
      <rect x="16" y="3" width="5" height="9" rx="1.5" />
    </svg>
  );
}

export function ListIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="3.5" cy="6" r="1.2" fill={color} stroke="none" />
      <circle cx="3.5" cy="12" r="1.2" fill={color} stroke="none" />
      <circle cx="3.5" cy="18" r="1.2" fill={color} stroke="none" />
    </svg>
  );
}

export function DownloadIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export function SearchIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function PlusIcon({ size = 20, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ size = 20, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function MenuIcon({ size = 20, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function EditIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

export function SettingsIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function TrashIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function CameraIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function ImageIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.8" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

export function AlertIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="17" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export function FireIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M12 2s4.5 4 4.5 8a4.5 4.5 0 0 1-9 0c0-1.5.6-2.8 1.3-3.8" />
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-4-2.5-5.5A5.5 5.5 0 0 1 12 15a5.5 5.5 0 0 1-4.5-5.5C6 11 5 13 5 15a7 7 0 0 0 7 7z" />
    </svg>
  );
}

/* ---------- Theme & Session ---------- */

export function SunIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5v2M12 20.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1.5 12h2M20.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function LogoutIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

/* ---------- Payment ---------- */

export function CashIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

export function CardIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h3" />
    </svg>
  );
}

export function GlobeIcon({ size = 20, color = "currentColor", strokeWidth = 1.8 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </svg>
  );
}

/* ---------- Spinner ---------- */

export function SpinnerIcon({ size = 20, color = "currentColor", strokeWidth = 2 }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={{ animation: "icon-spin 0.8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
      <style>{`@keyframes icon-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
