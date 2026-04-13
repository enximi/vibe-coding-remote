import { createContext, useContext, type PropsWithChildren } from 'react';
import type { VoiceBridgeBridge } from '@voice-bridge/shared';

const BridgeContext = createContext<VoiceBridgeBridge | null>(null);

export function BridgeProvider({
  bridge,
  children,
}: PropsWithChildren<{ bridge: VoiceBridgeBridge }>) {
  return <BridgeContext.Provider value={bridge}>{children}</BridgeContext.Provider>;
}

export function useBridge() {
  const bridge = useContext(BridgeContext);
  if (!bridge) {
    throw new Error('VoiceBridge bridge is not available in the current app shell.');
  }

  return bridge;
}
