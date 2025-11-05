import type { Metadata } from "next";
import type { ReactNode } from "react";
import "antd/dist/reset.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Table Memory Portal",
  description: "基于表格的长期记忆与流程自动化平台"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background text-base">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
