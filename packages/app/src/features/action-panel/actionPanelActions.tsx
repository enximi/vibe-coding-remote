import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BackspaceIcon,
  EscIcon,
  CtrlCIcon,
  CtrlVIcon,
  EnterIcon,
  PasteNewlineIcon,
  SendIcon,
  ShiftTabIcon,
  TabIcon,
} from '../../shared/ui/icons';
import type { ActionPanelActionKey } from '../preferences/preferences';

export type RemotePanelAction =
  | 'enter'
  | 'escape'
  | 'tab'
  | 'shift-tab'
  | 'ctrl-c'
  | 'ctrl-v'
  | 'paste-newline'
  | 'backspace'
  | 'arrow-up'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right';

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
    action: 'escape',
    ariaLabel: '发送 ESC',
    icon: <EscIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'escape',
    settingsLabel: 'ESC',
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
  {
    action: 'arrowUp',
    ariaLabel: '发送上方向键',
    icon: <ArrowUpIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'arrow-up',
    settingsLabel: '上方向键',
    type: 'remote',
  },
  {
    action: 'arrowDown',
    ariaLabel: '发送下方向键',
    icon: <ArrowDownIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'arrow-down',
    settingsLabel: '下方向键',
    type: 'remote',
  },
  {
    action: 'arrowLeft',
    ariaLabel: '发送左方向键',
    icon: <ArrowLeftIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'arrow-left',
    settingsLabel: '左方向键',
    type: 'remote',
  },
  {
    action: 'arrowRight',
    ariaLabel: '发送右方向键',
    icon: <ArrowRightIcon width={20} height={20} />,
    isContinuous: true,
    remoteAction: 'arrow-right',
    settingsLabel: '右方向键',
    type: 'remote',
  },
];

export const ACTION_PANEL_ACTION_BY_KEY = new Map(
  ACTION_PANEL_ACTION_DEFINITIONS.map((definition) => [definition.action, definition]),
);
