import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const grotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-grotesk', weight: ['400','500','600','700'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','500','700'] });

export const metadata: Metadata = {
  title: 'DegenSea — Sunset NFT Terminal',
  description: 'Floors, drops, charts & a degen launchpad — Miami sunset edition.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable} dark`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
