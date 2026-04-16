import {
  CornerDownLeft,
  Delete,
  Ellipsis,
  GripVertical,
  SendHorizontal,
  Settings2,
  X,
  Copy,
  ClipboardPaste,
  Monitor,
  Sun,
  Moon,
  ScanLine,
  type LucideProps,
} from 'lucide-react';

type IconProps = LucideProps;

const STROKE_WIDTH = 2.4;

export function ScanIcon(props: IconProps) {
  return <ScanLine strokeWidth={STROKE_WIDTH} {...props} />;
}

export function SettingsIcon(props: IconProps) {
  return <Settings2 strokeWidth={STROKE_WIDTH} {...props} />;
}

export function SystemThemeIcon(props: IconProps) {
  return <Monitor strokeWidth={STROKE_WIDTH} {...props} />;
}

export function LightThemeIcon(props: IconProps) {
  return <Sun strokeWidth={STROKE_WIDTH} {...props} />;
}

export function DarkThemeIcon(props: IconProps) {
  return <Moon strokeWidth={STROKE_WIDTH} {...props} />;
}

export function CtrlCIcon(props: IconProps) {
  return <Copy strokeWidth={STROKE_WIDTH} {...props} />;
}

export function CtrlVIcon(props: IconProps) {
  return <ClipboardPaste strokeWidth={STROKE_WIDTH} {...props} />;
}

export function TabIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14 6 20 12 14 18" />
      <line x1="20" y1="4" x2="20" y2="20" />
    </svg>
  );
}

export function EnterIcon(props: IconProps) {
  return <CornerDownLeft strokeWidth={STROKE_WIDTH} {...props} />;
}

export function ShiftTabIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="20" y1="12" x2="4" y2="12" />
      <polyline points="10 6 4 12 10 18" />
      <line x1="4" y1="4" x2="4" y2="20" />
    </svg>
  );
}

export function PasteNewlineIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE_WIDTH}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M15 10v3a2 2 0 0 1-2 2H9" />
      <polyline points="11 13 9 15 11 17" />
    </svg>
  );
}

export function BackspaceIcon(props: IconProps) {
  return <Delete strokeWidth={STROKE_WIDTH} {...props} />;
}

export function SendIcon(props: IconProps) {
  return <SendHorizontal strokeWidth={STROKE_WIDTH} {...props} />;
}

export function CloseIcon(props: IconProps) {
  return <X strokeWidth={STROKE_WIDTH} {...props} />;
}

export function GripIcon(props: IconProps) {
  return <GripVertical strokeWidth={STROKE_WIDTH} {...props} />;
}

export function MoreIcon(props: IconProps) {
  return <Ellipsis strokeWidth={STROKE_WIDTH} {...props} />;
}

