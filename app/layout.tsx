import type { Metadata } from "next";
import "./globals.css";
import { initDB } from "@/lib/db";

initDB();

export const metadata: Metadata = {
  title: "教学管理系统",
  description: "学生成绩管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased">{children}</body>
    </html>
  );
}
