import {
  BackspaceIcon,
  CtrlCIcon,
  CtrlVIcon,
  EnterIcon,
  PasteNewlineIcon,
  SendIcon,
  ShiftTabIcon,
  TabIcon,
} from '../../../ui/icons';
import type { ActionPanelActionKey } from '../../preferences/model/preferences';

export type RemotePanelAction =
  | 'enter'
  | 'tab'
  | 'shift-tab'
  | 'ctrl-c'
  | 'ctrl-v'
  | 'paste-newline'
  | 'backspace';

type ActionPanelActionBase = {
  action: ActionPanelActionKey;
  ariaLabel: string;
  icon: React.ReactNode;
  settingsLabel: string;
};

export type SendActionPanelActionDefinition = ActionPanelActionBase & {
  isContinuous: false;
  type: 'send';
};

export type RemoteActionPanelActionDefinition = ActionPanelActionBase & {
  isContinuous: boolean;
  remoteAction: RemotePanelAction;
  type: 'remote';
};

export type ActionPanelActionDefinition =
  | SendActionPanelActionDefinition
  | RemoteActionPanelActionDefinition;

export const ACTION_PANEL_ACTION_DEFINITIONS: ActionPanelActionDefinition[] = [
  {
    action: 'send',
    ariaLabel: '发送当前文本',
    icon: <SendIcon width={20} height={20} />,
    isContinuous: false,
    settingsLabel: '发送',
    type: 'send',
  },
  {
    action: 'backspace',
    ariaLabel: '发送 Backspace',
    icon: <BackspaceIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'backspace',
    settingsLabel: 'Backspace',
    type: 'remote',
  },
  {
    action: 'enter',
    ariaLabel: '发送 Enter',
    icon: <EnterIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'enter',
    settingsLabel: 'Enter',
    type: 'remote',
  },
  {
    action: 'tab',
    ariaLabel: '发送 Tab',
    icon: <TabIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'tab',
    settingsLabel: 'Tab',
    type: 'remote',
  },
  {
    action: 'shiftTab',
    ariaLabel: '发送 Shift+Tab',
    icon: <ShiftTabIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'shift-tab',
    settingsLabel: 'Shift+Tab',
    type: 'remote',
  },
  {
    action: 'ctrlC',
    ariaLabel: '发送 Ctrl+C',
    icon: <CtrlCIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'ctrl-c',
    settingsLabel: 'Ctrl+C',
    type: 'remote',
  },
  {
    action: 'ctrlV',
    ariaLabel: '发送 Ctrl+V',
    icon: <CtrlVIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'ctrl-v',
    settingsLabel: 'Ctrl+V',
    type: 'remote',
  },
  {
    action: 'pasteNewline',
    ariaLabel: '粘贴换行',
    icon: <PasteNewlineIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'paste-newline',
    settingsLabel: '粘贴换行',
    type: 'remote',
  },
];

export const ACTION_PANEL_ACTION_BY_KEY = new Map(
  ACTION_PANEL_ACTION_DEFINITIONS.map((definition) => [definition.action, definition]),
);
