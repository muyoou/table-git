"use client";

import { useMemo } from "react";
import { Card, Descriptions, Space, Tabs, Tag, Typography } from "antd";

type TemplateAttribute = {
  key: string;
  value: string;
};

const { Title, Paragraph } = Typography;

const attributes: TemplateAttribute[] = [
  { key: "表格名称", value: "旅店库存" },
  { key: "表格说明", value: "记录每日库存与供应商" },
  { key: "表格更新说明", value: "每日闭店后更新" },
  { key: "表格插入说明", value: "新菜品上线后由运营录入" },
  { key: "表格删除说明", value: "停售菜品保留历史标记" },
  { key: "表格版本", value: "1.3.0" },
  { key: "表格备注", value: "春节期间需额外库存" }
];

export default function TemplateDetailPage() {
  const descriptionItems = useMemo(
    () =>
      attributes.map((attr) => ({
        key: attr.key,
        label: attr.key,
        children: attr.value
      })),
    []
  );

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>模板详情</Title>
        <Paragraph className="text-gray-600">
          展示模板关联的表格属性与流程。实际数据将由 Supabase 与 table-memory-engine 提供。
        </Paragraph>
      </Space>
      <Card className="shadow-sm" title="表格属性">
        <Descriptions items={descriptionItems} column={2} bordered />
      </Card>
      <Card className="shadow-sm" title="流程概览">
        <Tabs
          items={[
            {
              key: "flow-1",
              label: "库存同步",
              children: <Tag color="green">已启用</Tag>
            },
            {
              key: "flow-2",
              label: "菜品上新",
              children: <Tag color="blue">测试中</Tag>
            }
          ]}
        />
      </Card>
    </Space>
  );
}
