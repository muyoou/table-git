"use client";

import { useState } from "react";
import { Badge, Card, Col, Divider, List, Row, Space, Tag, Timeline, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

const messages = [
  {
    id: "m1",
    role: "user",
    content: "请更新今晚的库存，鸡尾酒加 20 瓶。",
    time: "20:31"
  },
  {
    id: "m2",
    role: "ai",
    content: "已为鸡尾酒新增 20 瓶库存，并生成提交记录。",
    time: "20:32"
  }
];

const commitHistory = [
  {
    id: "c1",
    title: "AI 更新库存",
    description: "鸡尾酒数量从 30 调整为 50",
    time: "2025-10-24 20:32"
  },
  {
    id: "c0",
    title: "用户手动调整",
    description: "葡萄酒补货 10 瓶",
    time: "2025-10-24 19:10"
  }
];

export default function ConversationDetailPage() {
  const [activeTab, setActiveTab] = useState<string>("messages");

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>对话详情</Title>
        <Paragraph className="text-gray-600">
          展示对话上下文与表格实时状态。未来将接入实际表格编辑器组件与 diff 视图。
        </Paragraph>
      </Space>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            className="shadow-sm"
            title="对话记录"
            extra={<Badge status="processing" text="进行中" />}
            tabList={[
              { key: "messages", tab: "消息" },
              { key: "commits", tab: "提交记录" }
            ]}
            activeTabKey={activeTab}
            onTabChange={(key: string) => setActiveTab(key)}
          >
            {activeTab === "messages" ? (
              <List
                dataSource={messages}
                renderItem={(item: (typeof messages)[number]) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Text strong>{item.role === "user" ? "用户" : "AI"}</Text>}
                      description={item.content}
                    />
                    <Text type="secondary">{item.time}</Text>
                  </List.Item>
                )}
              />
            ) : (
              <Timeline
                items={commitHistory.map((commit) => ({
                  color: "blue",
                  children: (
                    <Space direction="vertical" size={0}>
                      <Text strong>{commit.title}</Text>
                      <Text>{commit.description}</Text>
                      <Text type="secondary">{commit.time}</Text>
                    </Space>
                  )
                }))}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="shadow-sm" title="表格预览" extra={<Tag color="blue">旅店库存</Tag>}>
            <Paragraph className="text-gray-500">
              表格编辑器组件将在此展示实际数据。当前放置占位示例。
            </Paragraph>
            <Divider />
            <Space direction="vertical" size="small" className="text-sm text-gray-600">
              <Text>鸡尾酒：50</Text>
              <Text>葡萄酒：40</Text>
              <Text>啤酒：120</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
