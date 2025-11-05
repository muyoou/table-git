"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Alert, Card, Space, Spin, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

const NodeEditor = dynamic(() => import("@portal/components/stubs/node-editor-stub").then((mod) => mod.NodeEditorStub), {
  ssr: false,
  loading: () => (
    <div className="grid h-80 place-items-center">
      <Spin size="large" />
    </div>
  )
});

const flowMetadata = {
  name: "库存同步",
  description: "同步供应链系统与酒馆库存。",
  version: "2.1.0"
};

export default function NodeEditorDetailPage() {
  const metadata = useMemo(() => flowMetadata, []);

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>{metadata.name}</Title>
        <Paragraph className="text-gray-600">{metadata.description}</Paragraph>
        <Text type="secondary">当前版本：{metadata.version}</Text>
      </Space>
      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <NodeEditor />
      </Card>
      <Alert
        type="info"
        showIcon
        message="节点编辑器原件将通过 packages/table-node-editor 集成，当前为占位组件。"
      />
    </Space>
  );
}
