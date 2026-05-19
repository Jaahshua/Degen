'use client';

import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

/**
 * Returns a function that runs the callback if the wallet is connected,
 * otherwise opens the RainbowKit connect modal. Lets buy/mint/launch
 * buttons stay declarative — pass them through this gate and you get
 * "connect first, then act" for free.
 */
export function useWalletGate() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (callback: () => void) => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    callback();
  };
}
