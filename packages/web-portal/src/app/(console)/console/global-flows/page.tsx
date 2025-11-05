"use client";

import Link from "next/link";
import { Card, List, Space, Switch, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

const globalFlows = [
  {
    id: "audit-log",
    name: "审计日志记录",
    description: "所有模板的变更都会记录到审计表中。",
    enabled: true
  },
  {
    id: "alerting",
    name: "库存告警",
    description: "当库存低于阈值时发送通知。",
    enabled: false
  }
];

export default function GlobalFlowsPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>全局流程</Title>
        <Paragraph className="text-gray-600">
          配置所有模板共用的流程，适用于日志、告警等基础能力。
        </Paragraph>
      </Space>
      <Card className="shadow-sm">
        <List
          itemLayout="horizontal"
          dataSource={globalFlows}
          renderItem={(flow: (typeof globalFlows)[number]) => (
            <List.Item
              actions={[
                <Switch key="toggle" defaultChecked={flow.enabled} />, // TODO: 接入真实状态
                <Link key="edit" href={`/console/node-editor/${flow.id}`}>
                  编辑
                </Link>
              ]}
            >
              <List.Item.Meta
                title={flow.name}
                description={<Text className="text-gray-600">{flow.description}</Text>}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
