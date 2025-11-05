"use client";

import { ApiOutlined, BuildOutlined } from "@ant-design/icons";
import { Card, Divider, Space, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

export default function NodeEditorSdkPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>节点编辑器 SDK</Title>
        <Paragraph className="text-gray-600">
          直接复用 `packages/table-node-editor` 中的渲染与运行时能力，在你的产品中构建流程化体验。
        </Paragraph>
      </Space>

      <Card className="shadow-sm" title="核心能力" extra={<ApiOutlined className="text-primary" />}> 
        <Space direction="vertical" size="middle" className="w-full text-gray-600">
          <Text>
            • React 组件：`&lt;NodeEditor /&gt;`, `&lt;ParameterPanel /&gt;`, `&lt;GraphStore /&gt;`。
          </Text>
          <Text>• 渲染层依赖 Pixi.js，支持大规模节点渲染与连线。</Text>
          <Text>• runtime 与 table-memory-engine 打通，流程执行结果可直接应用到表格仓库。</Text>
        </Space>
      </Card>

      <Card className="shadow-sm" title="接入步骤" extra={<BuildOutlined className="text-primary" />}> 
        <Space direction="vertical" size="middle" className="w-full text-gray-600">
          <Text>1. `npm install @portal/table-node-editor`（本地 workspace 引用）。</Text>
          <Text>2. 在 Next.js 中通过动态组件加载，禁用 SSR 确保 Pixi.js 正常工作。</Text>
          <Text>3. 结合 Supabase 存储流程配置，支持版本与权限管理。</Text>
        </Space>
        <Divider />
        <Paragraph className="text-gray-500">
          更多细节请阅读 `packages/table-node-editor/docs/node-library.md`，我们会在 web-portal 中提供 Storybook 演示与代码示例。
        </Paragraph>
      </Card>
    </Space>
  );
}
