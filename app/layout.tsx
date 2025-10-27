import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import './globals.css';
import { AppProviders } from './components/providers/AppProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://yoforex.net'),
  title: {
    default: 'YoForex - Expert Advisor Forum & EA Marketplace',
    template: '%s | YoForex',
  },
  description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins. #1 MT4/MT5 EA community.',
  keywords: ['forex forum', 'EA marketplace', 'Expert Advisor', 'MT4', 'MT5', 'forex trading', 'algorithmic trading'],
  authors: [{ name: 'YoForex' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://yoforex.net',
    siteName: 'YoForex',
    title: 'YoForex - Expert Advisor Forum & EA Marketplace',
    description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YoForex',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YoForex - Expert Advisor Forum & EA Marketplace',
    description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
