import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Database, ListFilter, Radar } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Opportunity Radar",
  description: "A local-first radar for money-making opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-neutral-200 bg-[#fbfbf8]">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
              <Link href="/opportunities" className="flex items-center gap-2 text-sm font-semibold text-neutral-950">
                <span className="grid size-8 place-items-center rounded-md bg-neutral-950 text-white">
                  <BarChart3 size={17} />
                </span>
                Opportunity Radar
              </Link>
              <nav className="flex max-w-full items-center gap-2 overflow-x-auto text-sm">
                <Link href="/sources" className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-neutral-600 hover:bg-white hover:text-neutral-950">
                  <Radar size={15} />
                  收集中心
                </Link>
                <Link href="/radar" className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-neutral-600 hover:bg-white hover:text-neutral-950">
                  <ListFilter size={15} />
                  原始信息
                </Link>
                <Link href="/opportunities" className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-neutral-600 hover:bg-white hover:text-neutral-950">
                  <Database size={15} />
                  机会池
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
