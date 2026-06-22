import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Research Assistant",
  description:
    "AI Research Assistant is an end-to-end RAG platform that ingests documents and repositories, performs semantic search, maintains conversation memory, and provides cited answers using large language models.",
  keywords: ["AI", "RAG", "documentation", "knowledge base", "chat", "research"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top,hsl(222,47%,14%),hsl(222,47%,8%)_45%,hsl(222,47%,5%)_100%)]">
          <Sidebar />
          <main className="flex-1 overflow-hidden flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
