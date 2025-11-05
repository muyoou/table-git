"use client";

import { Button, Space, Typography } from "antd";

const { Paragraph, Text, Title } = Typography;

export function NodeEditorStub() {
  return (
    <div className="grid h-[480px] place-items-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Space direction="vertical" align="center" size="middle">
        <Title level={4}>节点编辑器占位</Title>
        <Paragraph className="max-w-sm text-center text-gray-600">
          实际实现将加载 packages/table-node-editor 提供的 React 组件。当前用于演示布局与加载流程。
        </Paragraph>
        <Space>
          <Button type="primary">演示流程</Button>
          <Button>导入流程</Button>
        </Space>
        <Text type="secondary">支持版本化保存、调试运行与权限控制。</Text>
      </Space>
    </div>
  );
}
