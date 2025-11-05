"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { MenuProps } from "antd";
import { Layout, Menu } from "antd";

const { Header, Sider, Content } = Layout;

type ConsoleShellProps = {
  children: ReactNode;
};

const menuItems: Required<MenuProps>["items"] = [
  {
    key: "/console",
    label: <Link href="/console">概览</Link>
  },
  {
    key: "/console/templates",
    label: <Link href="/console/templates">模板</Link>
  },
  {
    key: "/console/conversations",
    label: <Link href="/console/conversations">对话</Link>
  },
  {
    key: "/console/global-flows",
    label: <Link href="/console/global-flows">全局流程</Link>
  },
  {
    key: "/console/table-editor",
    label: <Link href="/console/table-editor">表格编辑器</Link>
  },
  {
    key: "/console/node-editor",
    label: <Link href="/console/node-editor">节点编辑器</Link>
  }
];

export function ConsoleShell({ children }: ConsoleShellProps) {
  const pathname = usePathname();

  const selectedKeys = useMemo(() => {
    if (!pathname) return ["/console"];
    const base = pathname.split("/").slice(0, 3).join("/");
    return [base || "/console"];
  }, [pathname]);

  return (
    <Layout className="min-h-screen">
      <Sider width={220} theme="light" className="border-r border-gray-200">
        <div className="px-6 py-4 text-lg font-semibold">控制台</div>
        <Menu mode="inline" selectedKeys={selectedKeys} items={menuItems} />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-between bg-white px-8 shadow-sm">
          <span className="text-base font-medium text-gray-700">Table Memory 控制台</span>
          <Link className="text-sm text-primary" href="/">
            返回首页
          </Link>
        </Header>
        <Content className="bg-gray-50 p-8">{children}</Content>
      </Layout>
    </Layout>
  );
}
