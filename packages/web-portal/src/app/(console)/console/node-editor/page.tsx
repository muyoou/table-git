"use client";

import Link from "next/link";
import { Card, List, Space, Tag, Typography } from "antd";

const { Title, Paragraph } = Typography;

const flows = [
  {
    id: "inventory-sync",
    name: "库存同步",
    version: "2.1.0",
    status: "已发布"
  },
  {
    id: "menu-update",
    name: "菜品上新",
    version: "1.4.3",
    status: "草稿"
  }
];

export default function NodeEditorIndexPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>节点流程</Title>
        <Paragraph className="text-gray-600">
          在此管理全局或模板复用的流程，点击进入可视化节点编辑器。
        </Paragraph>
      </Space>
      <Card className="shadow-sm">
        <List
          itemLayout="horizontal"
          dataSource={flows}
          renderItem={(flow: (typeof flows)[number]) => (
            <List.Item
              actions={[
                <Link key="open" href={`/console/node-editor/${flow.id}`}>
                  编辑
                </Link>
              ]}
            >
              <List.Item.Meta
                title={flow.name}
                description={`版本：${flow.version}`}
              />
              <Tag color={flow.status === "已发布" ? "green" : "blue"}>{flow.status}</Tag>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
