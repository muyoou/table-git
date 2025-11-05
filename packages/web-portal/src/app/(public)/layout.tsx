import type { ReactNode } from "react";
import { MainNav } from "@portal/components/navigation/main-nav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-4">
          <MainNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-12">{children}</main>
      <footer className="border-t border-gray-200 bg-white/80 py-6">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Table Memory. 保留所有权利。</span>
          <span>版本 0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
