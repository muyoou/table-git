"use client";

import { Card, Space, Tabs, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

const tabItems = [
  {
    key: "overview",
    label: "概览",
    children: (
      <Space direction="vertical" size="middle" className="w-full text-gray-600">
        <Paragraph>
          记忆表格文档涵盖仓库结构、属性管理、与节点流程的联动方式。详细文字版本位于仓库 `doc/` 目录及未来的在线文档系统中。
        </Paragraph>
        <Paragraph>
          你可以通过 `packages/table-memory-engine/docs` 获得更细致的 API 与工作流说明。
        </Paragraph>
      </Space>
    )
  },
  {
    key: "quickstart",
    label: "快速开始",
    children: (
      <Space direction="vertical" size="small" className="w-full text-gray-600">
        <Text>1. 创建 Supabase 项目，配置 Auth 与数据库。</Text>
        <Text>2. 在控制台中创建模板，关联表格仓库与流程。</Text>
        <Text>3. 使用 `@memory-engine` hooks 在页面中读取仓库数据。</Text>
        <Text>4. 在表格编辑器中提交变更，观察 commit 历史。</Text>
      </Space>
    )
  }
];

export default function MemoryTableDocsPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Title level={2}>记忆表格文档</Title>
      <Card className="shadow-sm">
        <Tabs items={tabItems} defaultActiveKey="overview" />
      </Card>
    </Space>
  );
}
