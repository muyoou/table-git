"use client";

import { CheckCircleOutlined, DatabaseOutlined, RobotOutlined } from "@ant-design/icons";
import { Alert, Card, Col, Divider, Row, Space, Steps, Tag, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

const capabilities = [
  {
    title: "表格版本",
    description: "以提交的方式记录每一次单元格与结构变更，支持回滚、分支与合并。",
    icon: <DatabaseOutlined className="text-2xl text-primary" />
  },
  {
    title: "属性扩展",
    description: "通过键值对属性为仓库提供上下文，在流程中随时读取与修改。",
    icon: <CheckCircleOutlined className="text-2xl text-primary" />
  },
  {
    title: "协同编辑",
    description: "区分用户、AI 与市场合并的变更来源，审计日志一目了然。",
    icon: <RobotOutlined className="text-2xl text-primary" />
  }
];

const steps = [
  {
    title: "初始化仓库",
    description: "从模板或市场克隆，或创建全新空白仓库。"
  },
  {
    title: "定义属性",
    description: "设置名称、说明、更新说明等基础信息，并添加自定义属性。"
  },
  {
    title: "连接流程",
    description: "在节点编辑器中配置流程，让表格与 AI 协同更新。"
  },
  {
    title: "发布与运营",
    description: "在控制台实时查看对话状态，并将成果发布至市场。"
  }
];

export default function MemoryTablePage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Tag color="geekblue">产品</Tag>
        <Title level={2}>记忆表格</Title>
        <Paragraph className="text-gray-600">
          TableGit 的表格仓库能力，通过 `table-memory-engine` 的业务封装，为智能体提供可追踪的结构化记忆。
        </Paragraph>
      </Space>

      <Row gutter={[24, 24]}>
        {capabilities.map((item) => (
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
        <Title level={3}>实现路径</Title>
        <Paragraph className="text-gray-600">
          在 `packages/table-memory-engine` 中，我们提供了对 TableGit 的高阶封装，包括仓库管理、属性读写、流程触发与提交记录服务。
        </Paragraph>
        <Divider />
        <Steps
          direction="vertical"
          current={steps.length}
          items={steps.map((item) => ({
            title: item.title,
            description: item.description
          }))}
        />
      </Card>

      <Card className="shadow-sm">
        <Title level={3}>集成要点</Title>
        <Space direction="vertical" size="middle" className="w-full">
          <Paragraph>
            <Text strong>1. API 封装</Text>: 通过 `@memory-engine` 提供的服务类获取仓库上下文，在前端使用 React Query 实现数据缓存。
          </Paragraph>
          <Paragraph>
            <Text strong>2. 权限模型</Text>: 借助 Supabase Auth，区分模板所有者、维护者、编辑者与查看者的权限边界。
          </Paragraph>
          <Paragraph>
            <Text strong>3. 表格编辑器</Text>: 集成第三方表格组件（如 AG Grid），结合仓库 diff 能力实现版本对比与回滚。
          </Paragraph>
        </Space>
        <Alert
          type="info"
          message="所有对仓库的操作都通过 table-memory-engine 的接口完成，避免直接依赖底层 tableGit。"
          showIcon
          className="mt-6"
        />
      </Card>
    </Space>
  );
}
