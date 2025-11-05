"use client";

import { useMemo } from "react";
import { Card, Col, Row, Space, Statistic, Typography } from "antd";

const { Title, Paragraph } = Typography;

const metrics = {
  templates: 6,
  conversations: 18,
  globalFlows: 4,
  marketItems: 12
};

export default function ConsoleOverviewPage() {
  const cards = useMemo<Array<{ title: string; value: number }>>(
    () => [
      { title: "模板", value: metrics.templates },
      { title: "对话", value: metrics.conversations },
      { title: "全局流程", value: metrics.globalFlows },
      { title: "市场条目", value: metrics.marketItems }
    ],
    []
  );

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>控制台概览</Title>
        <Paragraph className="text-gray-600">
          概览模板资产、活跃对话与市场活动。真实数据将来自 Supabase 与 table-memory-engine 的统计接口。
        </Paragraph>
      </Space>
      <Row gutter={[24, 24]}>
        {cards.map((card) => (
          <Col xs={24} md={6} key={card.title}>
            <Card className="shadow-sm">
              <Statistic title={card.title} value={card.value} />
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
