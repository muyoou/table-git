"use client";

import Link from "next/link";
import { Card, List, Space, Tag, Typography } from "antd";

const { Title, Paragraph } = Typography;

const repositories = [
  {
    id: "tavern-memory",
    name: "旅店库存仓库",
    status: "clean",
    branch: "main"
  },
  {
    id: "crm-table",
    name: "CRM 客户仓库",
    status: "dirty",
    branch: "feature/quarterly-report"
  }
];

export default function TableEditorIndexPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>表格仓库</Title>
        <Paragraph className="text-gray-600">
          选择仓库进入表格编辑器。未来将支持搜索、标签与权限过滤。
        </Paragraph>
      </Space>
      <Card className="shadow-sm">
        <List
          itemLayout="horizontal"
          dataSource={repositories}
          renderItem={(repo: (typeof repositories)[number]) => (
            <List.Item
              actions={[
                <Link key="open" href={`/console/table-editor/${repo.id}`}>
                  打开
                </Link>
              ]}
            >
              <List.Item.Meta
                title={repo.name}
                description={`分支：${repo.branch}`}
              />
              <Tag color={repo.status === "clean" ? "green" : "orange"}>
                {repo.status === "clean" ? "清洁" : "未提交"}
              </Tag>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
}
