import type { ReactNode } from "react";
import dynamic from "next/dynamic";

const ConsoleShell = dynamic(() => import("@portal/components/layout/console-shell").then((mod) => mod.ConsoleShell), {
  ssr: false
});

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ConsoleShell>{children}</ConsoleShell>;
}
