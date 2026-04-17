import type { VibeCodingRemoteBridge } from '@vibe-coding-remote/shared';
import { createContext, type PropsWithChildren, useContext } from 'react';

const BridgeContext = createContext<VibeCodingRemoteBridge | null>(null);

export function BridgeProvider({
  bridge,
  children,
}: PropsWithChildren<{ bridge: VibeCodingRemoteBridge }>) {
  return <BridgeContext.Provider value={bridge}>{children}</BridgeContext.Provider>;
}

export function useBridge() {
  const bridge = useContext(BridgeContext);
  if (!bridge) {
    throw new Error('VibeCodingRemote bridge is not available in the current app shell.');
  }

  return bridge;
}
