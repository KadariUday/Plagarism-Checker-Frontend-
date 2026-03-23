import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Originality & Research Suite',
  description: 'AI-driven contextual plagiarism detection and citation generation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased selection:bg-purple-500/30`}>
        {children}
      </body>
    </html>
  );
}
