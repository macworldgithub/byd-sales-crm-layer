import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CrmProvider } from '@/lib/crmContext';

export const metadata: Metadata = {
  title: 'BYD Sales CRM · Operational Sales Desk | OmniSuiteAI × BYD Harmony',
  description:
    'The operational and engagement system for the BYD sales team — sitting between Lead Centre and Delivery Centre, with one customer record, shared notes and threads, department and individual sales tracking, and bidirectional synchronization with Virtual Yard and Sales Log.',
  keywords: [
    'BYD',
    'Sales CRM',
    'Fairfield',
    'Melbourne City',
    'Harmony Auto',
    'OmniSuiteAI',
    'Lead Centre',
    'Delivery Centre',
    'Virtual Yard',
    'Sales Log',
    'SEALION 7',
    'SHARK 6',
    'SEAL',
    'ATTO 3',
  ],
  authors: [{ name: 'OmniSuiteAI × Harmony Auto' }],
  icons: {
    icon: '/images/official-byd-melbourne-cbd-lockup.png',
    apple: '/images/official-byd-melbourne-cbd-lockup.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#171b22',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CrmProvider>{children}</CrmProvider>
      </body>
    </html>
  );
}
