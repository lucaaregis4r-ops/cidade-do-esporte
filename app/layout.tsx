import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const DESCRIPTION = 'Acompanhe uma cidade mineira fictícia de 1910 a 1959 e construa a história de um clube de futebol — Tradição Esporte Clube.';

export const metadata: Metadata = {
  title: 'Tradição Esporte Clube',
  description: DESCRIPTION,
  applicationName: 'Tradição Esporte Clube',
  openGraph: { title: 'Tradição Esporte Clube', description: DESCRIPTION, type: 'website', locale: 'pt_BR' },
  twitter: { card: 'summary', title: 'Tradição Esporte Clube', description: DESCRIPTION },
};

export const viewport: Viewport = { themeColor: '#19201d' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
