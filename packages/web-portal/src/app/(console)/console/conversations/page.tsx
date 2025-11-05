"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge, Card, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

type ConversationRow = {
  key: string;
  name: string;
  template: string;
  status: "active" | "closed";
  updatedAt: string;
};

const { Title, Paragraph } = Typography;

export default function ConversationsPage() {
  const dataSource = useMemo<ConversationRow[]>(
    () => [
      {
        key: "client-x",
        name: "客户 A 项目",
        template: "CRM 管理",
        status: "active",
        updatedAt: "2025-10-24"
      },
      {
        key: "tavern-night",
        name: "酒馆夜班",
        template: "旅店运营",
        status: "closed",
        updatedAt: "2025-10-20"
      }
    ],
    []
  );

  const columns: ColumnsType<ConversationRow> = [
    {
      title: "对话名称",
      dataIndex: "name",
      render: (text: string, record: ConversationRow) => (
        <Link href={`/console/conversations/${record.key}`}>{text}</Link>
      )
    },
    {
      title: "模板",
      dataIndex: "template",
      render: (value: string) => <Tag color="blue">{value}</Tag>
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (value: ConversationRow["status"]) => (
        <Badge status={value === "active" ? "processing" : "default"} text={value} />
      )
    },
    {
      title: "最近更新",
      dataIndex: "updatedAt"
    }
  ];

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>对话列表</Title>
        <Paragraph className="text-gray-600">
          查看对话实例和最近的表格状态。未来将支持筛选、排序及批量操作。
        </Paragraph>
      </Space>
      <Card className="shadow-sm">
        <Table columns={columns} dataSource={dataSource} pagination={false} />
      </Card>
    </Space>
  );
}
