import type { Metadata, Viewport } from 'next';
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import './globals.css';

export const metadata: Metadata = {
  title: 'Signature QuoteCrawler',
  description: 'Quote builder with Signature Solar price cache',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen"><StackProvider app={stackClientApp}><StackTheme>
        {children}
      </StackTheme></StackProvider></body>
    </html>
  );
}