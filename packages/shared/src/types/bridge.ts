import type { ApiResponse, KeyChord, ServerAction, ServerCode } from './server';

export type VibrationPattern = number | number[];

export interface VibeCodingRemoteBridge {
  executeAction(action: ServerAction): Promise<ApiResponse>;
  inputText(text: string): Promise<ApiResponse>;
  sendKeySequence(sequence: KeyChord[]): Promise<ApiResponse>;
  sendKeyChord(keys: ServerCode[]): Promise<ApiResponse>;
  vibrate(pattern?: VibrationPattern): void;
}
