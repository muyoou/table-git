"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button, Card, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

type TemplateRow = {
  key: string;
  name: string;
  repo: string;
  flows: number;
  updatedAt: string;
};

const { Title, Paragraph } = Typography;

export default function TemplatesPage() {
  const dataSource = useMemo<TemplateRow[]>(
    () => [
      {
        key: "tavern",
        name: "旅店运营",
        repo: "tavern-memory",
        flows: 3,
        updatedAt: "2025-10-22"
      },
      {
        key: "crm",
        name: "CRM 管理",
        repo: "crm-table",
        flows: 2,
        updatedAt: "2025-10-20"
      }
    ],
    []
  );

  const columns: ColumnsType<TemplateRow> = [
    {
      title: "模板名称",
      dataIndex: "name",
      render: (text: string, record: TemplateRow) => (
        <Link href={`/console/templates/${record.key}`}>{text}</Link>
      )
    },
    {
      title: "表格仓库",
      dataIndex: "repo",
      render: (value: string) => <Tag>{value}</Tag>
    },
    {
      title: "流程数量",
      dataIndex: "flows"
    },
    {
      title: "最近更新",
      dataIndex: "updatedAt"
    }
  ];

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>模板管理</Title>
        <Paragraph className="text-gray-600">
          管理模板与关联的表格仓库、节点流程。实际数据将来自 Supabase 表。
        </Paragraph>
      </Space>
      <Card className="shadow-sm" extra={<Link href="/console/templates/new"><Button type="primary">新建模板</Button></Link>}>
        <Table columns={columns} dataSource={dataSource} pagination={false} />
      </Card>
    </Space>
  );
}
