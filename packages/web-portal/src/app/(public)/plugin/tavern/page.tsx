"use client";

import { Alert, Card, Space, Steps, Tag, Typography } from "antd";
import { ApiOutlined, CustomerServiceOutlined, SmileOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const steps = [
  {
    title: "安装插件",
    description: "在控制台获取 API Key，将酒馆插件部署至你的对话入口。",
    icon: <ApiOutlined />
  },
  {
    title: "连接模板",
    description: "选择需要服务的模板，对接表格仓库并同步节点流程。",
    icon: <CustomerServiceOutlined />
  },
  {
    title: "上线运营",
    description: "在频道中启用插件，实时同步库存、推荐和客人偏好。",
    icon: <SmileOutlined />
  }
];

export default function TavernPluginPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Tag color="purple">插件</Tag>
        <Title level={2}>酒馆插件</Title>
        <Paragraph className="text-gray-600">
          将旅店/餐饮场景的表格记忆即时接入聊天工具，为员工和顾客提供实时知识支持。
        </Paragraph>
      </Space>

      <Card className="shadow-sm">
        <Title level={3}>使用指南</Title>
        <Steps
          current={steps.length}
          items={steps.map((item) => ({
            title: item.title,
            description: item.description,
            icon: item.icon
          }))}
        />
      </Card>

      <Card className="shadow-sm">
        <Title level={3}>能力范围</Title>
        <Paragraph className="text-gray-600">
          插件通过节点流程读取与更新表格仓库，可处理库存、菜单、会员偏好等信息。对话记录会同步至 Supabase，确保每次服务可回溯。
        </Paragraph>
        <Alert
          type="info"
          showIcon
          message="插件的执行权限继承模板配置，请为敏感字段配置只读或审批流程。"
        />
      </Card>

      <Card className="shadow-sm">
        <Title level={3}>开发者提示</Title>
        <Space direction="vertical" size="small" className="text-gray-600">
          <Text>• 支持自定义 Supabase Edge Functions，扩展业务校验逻辑。</Text>
          <Text>• 可与市场上的流程组合，实现跨模板的知识同步。</Text>
        </Space>
      </Card>
    </Space>
  );
}
