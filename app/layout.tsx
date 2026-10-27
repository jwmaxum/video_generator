import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Video Pipeline Studio - 1~5분 영상 반자동 제작 파이프라인',
  description:
    '제품, 서비스, IT테크, 지식 등 원천 자료를 1~5분 쇼츠 및 롱폼 영상으로 반자동 제작하는 마스터 스튜디오 (Gemini 3.8 & Google Flow)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="light">
      <body className="antialiased selection:bg-indigo-500 selection:text-white bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
