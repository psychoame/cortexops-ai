import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CortexOps AI — Infrastructure Intelligence',
  description: 'AI-powered incident detection and root cause analysis',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
