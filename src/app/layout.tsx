import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "수학 문제 생성기",
  description: "원리셈 수학 문제 생성기",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
