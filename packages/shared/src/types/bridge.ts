export type ApiResponse = {
  ok: boolean;
};

export type InputActionKey =
  | 'enter'
  | 'tab'
  | 'backspace'
  | 'copy'
  | 'paste'
  | 'newline';

export type VibrationPattern = number | number[];

export interface VoiceBridgeBridge {
  sendText(text: string): Promise<ApiResponse>;
  pressKey(key: InputActionKey): Promise<ApiResponse>;
  vibrate(pattern?: VibrationPattern): void;
}
