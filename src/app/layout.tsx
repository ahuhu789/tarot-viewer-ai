import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

// All three families ship a Vietnamese subset, so diacritics (ạ, ế, ữ, ẫ…)
// render in the intended typeface instead of falling back glyph-by-glyph.
// The CSS variables are prefixed `--nf-` so globals.css can build the final
// `--font-*` stacks without referencing itself (which invalidates the var).
const headingFont = Playfair_Display({
  variable: '--nf-heading',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
});

const bodyFont = Cormorant_Garamond({
  variable: '--nf-body',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const uiFont = Inter({
  variable: '--nf-ui',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tarot Sanctuary — AI Tarot Reading Room',
  description:
    'Enter a quiet space, set your intention, and reflect through a stateful AI tarot reading powered by LangGraph.js and Qwen.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#030308',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${headingFont.variable} ${bodyFont.variable} ${uiFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
