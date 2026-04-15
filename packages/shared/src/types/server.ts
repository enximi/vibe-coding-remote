export type ApiResponse = {
  ok: boolean;
};

export type ServerKeyName = 'tab' | 'enter' | 'backspace';

export type ServerShortcut = 'ctrl-c' | 'ctrl-v' | 'shift-tab';

export type ServerAction =
  | {
      type: 'send-key';
      key: ServerKeyName;
    }
  | {
      type: 'send-shortcut';
      shortcut: ServerShortcut;
    }
  | {
      type: 'paste-text';
      text: string;
    };

export type ServerActionRequest = {
  action: ServerAction;
};
