"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { MenuProps } from "antd";
import { Button, Menu, Space, Typography } from "antd";

type MenuItem = Required<MenuProps>["items"][number];
type MenuSubItem = Extract<MenuItem, { children?: MenuItem[] }>;

const { Text } = Typography;

const navItems: MenuItem[] = [
  {
    key: "/",
    label: <Link href="/">首页</Link>
  },
  {
    key: "product",
    label: "产品",
    children: [
      {
        key: "/product/memory-table",
        label: <Link href="/product/memory-table">记忆表格</Link>
      },
      {
        key: "/product/node-editor",
        label: <Link href="/product/node-editor">节点编辑器</Link>
      }
    ]
  },
  {
    key: "plugin",
    label: "插件",
    children: [
      {
        key: "/plugin/tavern",
        label: <Link href="/plugin/tavern">酒馆插件</Link>
      }
    ]
  },
  {
    key: "sdk",
    label: "开发工具包",
    children: [
      {
        key: "/sdk/table-git",
        label: <Link href="/sdk/table-git">TableGit</Link>
      },
      {
        key: "/sdk/node-editor",
        label: <Link href="/sdk/node-editor">节点编辑器</Link>
      }
    ]
  },
  {
    key: "docs",
    label: "文档",
    children: [
      {
        key: "/docs/memory-table",
        label: <Link href="/docs/memory-table">记忆表格</Link>
      },
      {
        key: "/docs/node-editor",
        label: <Link href="/docs/node-editor">节点编辑器</Link>
      }
    ]
  },
  {
    key: "/market",
    label: <Link href="/market">市场</Link>
  }
];

const hasChildren = (item: MenuItem): item is MenuSubItem & { children: MenuItem[] } =>
  Boolean(item && typeof item === "object" && "children" in item && Array.isArray(item.children));

const matchKey = (pathname: string): string[] => {
  if (pathname === "/") {
    return ["/"];
  }

  const directMatch = navItems.find((item) => item?.key === pathname);
  if (directMatch) {
    return [pathname as string];
  }

  const groupMatch = navItems.find(
    (item) => hasChildren(item) && item.children.some((subItem) => subItem?.key === pathname)
  );

  if (groupMatch?.key) {
    return [pathname, groupMatch.key as string];
  }

  return [];
};

export function MainNav() {
  const pathname = usePathname();

  const selectedKeys = useMemo(() => matchKey(pathname ?? "/"), [pathname]);

  return (
    <div className="flex w-full items-center justify-between">
      <Space size="large">
        <Text className="text-xl font-semibold">Table Memory</Text>
        <Menu
          mode="horizontal"
          selectedKeys={selectedKeys}
          items={navItems}
          triggerSubMenuAction="hover"
        />
      </Space>
      <Space>
        <Button type="text" href="/market">
          市场
        </Button>
        <Button type="primary" href="/console">
          控制台
        </Button>
      </Space>
    </div>
  );
}
