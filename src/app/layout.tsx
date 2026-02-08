import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import SessionProvider from '@/components/SessionProvider';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: '대본 검토 에이전트 | Script Review Agent',
  description: '대본을 업로드하고 구조, 문법, 오타, 인물 일관성을 자동으로 검토합니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
