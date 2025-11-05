"use client";

import { ApiOutlined, BranchesOutlined, CloudUploadOutlined } from "@ant-design/icons";
import { Card, Col, Divider, List, Row, Space, Tag, Typography } from "antd";

const { Title, Paragraph } = Typography;

const sections = [
  {
    title: "可视化流程构建",
    description:
      "通过节点、连线与参数面板组合业务逻辑，实时预览执行顺序，支持拖拽、复制与模板化。",
    icon: <BranchesOutlined className="text-2xl text-primary" />
  },
  {
    title: "可迁移组件",
    description:
      "节点编辑器以 `packages/table-node-editor` 提供的组件为核心，可在任意 React 环境中复用。",
    icon: <ApiOutlined className="text-2xl text-primary" />
  },
  {
    title: "发布与版本",
    description:
      "流程配置可版本化管理，支持发布到模板或全局流程，也可以在市场共享。",
    icon: <CloudUploadOutlined className="text-2xl text-primary" />
  }
];

const developerNotes = [
  "节点运行时在 `packages/table-node-editor/src/runtime` 中实现，可在 Supabase Edge Functions 或 Next.js Route Handler 中复用。",
  "流程导出与导入接口通过 table-memory-engine 暴露，确保模板与市场之间的兼容性。",
  "控制台中提供流程调试工具，可视化查看事件输入、输出与日志。"
];

export default function NodeEditorPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Tag color="geekblue">产品</Tag>
        <Title level={2}>节点编辑器</Title>
        <Paragraph className="text-gray-600">
          将流程能力模块化、可视化，帮助开发者与运营团队共同维护 AI 与表格之间的交互逻辑。
        </Paragraph>
      </Space>

      <Row gutter={[24, 24]}>
        {sections.map((item) => (
          <Col xs={24} md={8} key={item.title}>
            <Card bordered={false} className="h-full shadow-sm">
              <Space direction="vertical" size="middle" className="w-full">
                {item.icon}
                <Title level={4}>{item.title}</Title>
                <Paragraph className="text-gray-600">{item.description}</Paragraph>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm">
        <Title level={3}>开发集成提示</Title>
        <Divider />
        <List
          dataSource={developerNotes}
          renderItem={(note: string) => <List.Item className="text-gray-600">{note}</List.Item>}
        />
      </Card>
    </Space>
  );
}
