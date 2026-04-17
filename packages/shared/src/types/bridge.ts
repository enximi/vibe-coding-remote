import type { ApiResponse, ServerAction, ServerKeyName, ServerShortcut } from './server';

export type VibrationPattern = number | number[];

export interface VibeCodingRemoteBridge {
  executeAction(action: ServerAction): Promise<ApiResponse>;
  sendKey(key: ServerKeyName): Promise<ApiResponse>;
  sendShortcut(shortcut: ServerShortcut): Promise<ApiResponse>;
  pasteText(text: string): Promise<ApiResponse>;
  vibrate(pattern?: VibrationPattern): void;
}
