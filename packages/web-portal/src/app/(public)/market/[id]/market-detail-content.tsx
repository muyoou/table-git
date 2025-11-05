"use client";

import { Card, Divider, Space, Tag, Typography } from "antd";

type MarketDetail = {
  name: string;
  type: string;
  allow: string;
  tags: string[];
  disclaimer: string;
  readme: string;
};

const { Title, Paragraph, Text } = Typography;

type MarketDetailContentProps = {
  detail: MarketDetail;
};

export function MarketDetailContent({ detail }: MarketDetailContentProps) {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Title level={2}>{detail.name}</Title>
      <Space size="middle" wrap>
        <Tag color="blue">类型：{detail.type}</Tag>
        <Tag color="green">允许：{detail.allow}</Tag>
        {detail.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </Space>
      <Card className="shadow-sm" title="声明">
        <Text className="text-gray-600">{detail.disclaimer}</Text>
      </Card>
      <Card className="shadow-sm" title="README">
        <Paragraph className="whitespace-pre-wrap text-gray-600">{detail.readme}</Paragraph>
      </Card>
      <Divider />
      <Card className="shadow-sm" title="操作">
        <Space>
          <Tag color="purple">Clone</Tag>
          <Tag color="cyan">Merge</Tag>
        </Space>
        <Paragraph className="mt-4 text-gray-500">
          实际操作将通过控制台调用 `@memory-engine` 的 clone/merge 接口，此处为占位按钮。
        </Paragraph>
      </Card>
    </Space>
  );
}
