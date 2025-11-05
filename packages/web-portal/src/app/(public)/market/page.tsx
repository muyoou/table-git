"use client";

import Link from "next/link";
import { Card, Col, Row, Space, Tag, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

const marketItems = [
  {
    id: "tavern-memory",
    name: "酒馆记忆模板",
    type: "混合",
    allow: "Clone + Merge",
    tags: ["餐饮", "节点流程"],
    description: "包含库存、菜单与会员流程的完整模板，适用于中小型餐饮场景。"
  },
  {
    id: "crm-table",
    name: "CRM 客户仓库",
    type: "纯仓库",
    allow: "Clone",
    tags: ["销售", "AI 对话"],
    description: "标准化客户画像与跟进记录，内置 AI 对话提示词。"
  },
  {
    id: "marketing-flow",
    name: "营销自动化流程",
    type: "纯流程",
    allow: "Merge",
    tags: ["营销", "自动化"],
    description: "基于节点编辑器构建的多渠道营销流程，可与任意模板结合。"
  }
];

export default function MarketPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>市场</Title>
        <Paragraph className="text-gray-600">
          浏览社区分享的表格仓库与流程方案，查看开放策略与标签分类，快速构建你的业务模板。
        </Paragraph>
      </Space>

      <Row gutter={[24, 24]}>
        {marketItems.map((item) => (
          <Col key={item.id} xs={24} md={8}>
            <Card
              title={item.name}
              extra={<Link href={`/market/${item.id}`}>查看</Link>}
              className="h-full shadow-sm"
            >
              <Space direction="vertical" size="small" className="w-full text-gray-600">
                <Text>类型：{item.type}</Text>
                <Text>允许：{item.allow}</Text>
                <Space size={4} wrap>
                  {item.tags.map((tag) => (
                    <Tag key={`${item.id}-${tag}`} color="blue">
                      {tag}
                    </Tag>
                  ))}
                </Space>
                <Paragraph>{item.description}</Paragraph>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
