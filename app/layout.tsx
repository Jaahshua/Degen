import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DegenSea — Pure NFT Meme Terminal',
  description: 'No JPEGs. No lore. Just floors, charts & degen action.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
