"use client";

import { Card, Collapse, Space, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

const faqItems = [
  {
    key: "rendering",
    label: "如何在 Next.js 中渲染节点编辑器?",
    children: (
      <Paragraph className="text-gray-600">
        使用动态导入并禁用 SSR，例如{' '}
        <Text code>{'const NodeEditor = dynamic(() => import("..."), { ssr: false })'}</Text>
        ，确保 Pixi.js 在浏览器环境运行。
      </Paragraph>
    )
  },
  {
    key: "persistence",
    label: "如何保存流程配置?",
    children: (
      <Paragraph className="text-gray-600">
        建议将流程 JSON 存储在 Supabase 表中，并结合 `@memory-engine` 的导入/导出能力，为模板与市场分享提供统一格式。
      </Paragraph>
    )
  }
];

export default function NodeEditorDocsPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Title level={2}>节点编辑器文档</Title>

      <Card className="shadow-sm">
        <Space direction="vertical" size="middle" className="w-full">
          <Paragraph className="text-gray-600">
            文档内容将同步 `packages/table-node-editor/docs`，包含节点列表、事件机制与渲染 API。以下是常见问题的快速回答。
          </Paragraph>
          <Collapse items={faqItems} defaultActiveKey={["rendering"]} />
          <Text type="secondary">
            更多内容，请关注即将上线的交互示例与 Storybook。
          </Text>
        </Space>
      </Card>
    </Space>
  );
}
