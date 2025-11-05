"use client";

import Link from "next/link";
import { Card, List, Space, Tag, Typography } from "antd";

const { Title, Paragraph } = Typography;

const flows = [
  {
    id: "inventory-sync",
    name: "库存同步",
    status: "已启用",
    updatedAt: "2025-10-22"
  },
  {
    id: "menu-update",
    name: "菜品上新",
    status: "测试中",
    updatedAt: "2025-10-19"
  }
];

export default function TemplateFlowsPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>模板流程</Title>
        <Paragraph className="text-gray-600">
          管理模板绑定的节点编辑器流程，可查看状态与跳转至编辑器进行调试。
        </Paragraph>
      </Space>
      <Card className="shadow-sm">
        <List
          itemLayout="horizontal"
          dataSource={flows}
          renderItem={(item: (typeof flows)[number]) => (
            <List.Item
              actions={[
                <Link key="view" href={`/console/node-editor/${item.id}`}>
                  查看
                </Link>
              ]}
            >
              <List.Item.Meta
                title={item.name}
                description={`最近更新：${item.updatedAt}`}
              />
              <Tag color={item.status === "已启用" ? "green" : "blue"}>{item.status}</Tag>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
