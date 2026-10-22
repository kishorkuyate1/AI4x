import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Screenshot Bug Reporter',
  description: 'Upload a screenshot and create a Jira-ready bug report',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
