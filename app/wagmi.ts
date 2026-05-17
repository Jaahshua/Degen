import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base, arbitrum, optimism, polygon } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'DegenSea',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'degensea_demo_project',
  chains: [mainnet, base, arbitrum, optimism, polygon],
  ssr: true,
});
