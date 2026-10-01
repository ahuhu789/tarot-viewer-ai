import type { Metadata } from 'next';
import { Cinzel, Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-ui',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: '🔮 Tarot Viewer — Immersive AI Reading Room',
  description: 'Enter a quiet space, set your intention, and seek clarity through a stateful AI tarot reading session powered by LangGraph.js and Gemini.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
