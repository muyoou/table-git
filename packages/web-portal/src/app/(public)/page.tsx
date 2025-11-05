"use client";

import { ArrowRightOutlined, DeploymentUnitOutlined, TableOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";
import Link from "next/link";

const { Title, Paragraph } = Typography;

const featureCards = [
  {
    icon: <TableOutlined className="text-3xl text-primary" />,
    title: "表格仓库",
    description: "以 Git 的方式记录每一次单元格变更，构建可回溯的长期记忆。"
  },
  {
    icon: <DeploymentUnitOutlined className="text-3xl text-primary" />,
    title: "节点流程",
    description: "通过节点可视化配置智能流程，让 AI 与规则协同驱动更新。"
  },
  {
    icon: <ArrowRightOutlined className="text-3xl text-primary" />,
    title: "市场生态",
    description: "沉淀模板、流程与仓库，在社区中分享与复用最佳实践。"
  }
];

export default function HomePage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-white to-white p-12 shadow-sm">
        <Space direction="vertical" size="middle" className="max-w-3xl">
          <Tag color="blue">长期记忆</Tag>
          <Title level={1}>为 AI 建立有结构的长期记忆</Title>
          <Paragraph className="text-lg text-gray-600">
            连接表格仓库、节点流程与市场生态，为智能体带来可追踪、可协作、可分享的知识体系。
          </Paragraph>
          <Space size="middle">
            <Button type="primary" size="large" href="/console">
              立即体验
            </Button>
            <Button size="large" href="/product/memory-table" icon={<ArrowRightOutlined />}>
              产品介绍
            </Button>
          </Space>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {featureCards.map((card) => (
          <Col key={card.title} xs={24} md={8}>
            <Card bordered={false} className="h-full shadow-sm">
              <Space direction="vertical" size="middle" className="w-full">
                {card.icon}
                <Title level={4}>{card.title}</Title>
                <Paragraph className="text-gray-600">{card.description}</Paragraph>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm">
        <Row gutter={24} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" size="middle" className="w-full">
              <Title level={3}>从模板到运营，一站式掌控</Title>
              <Paragraph className="text-gray-600">
                模板管理、对话驱动与全局流程构建，共建统一的业务表达层。通过 Supabase 实现实时身份与数据同步，确保每一次更新都可追踪、可回滚。
              </Paragraph>
              <Space>
                <Button type="primary" href="/market">
                  浏览市场
                </Button>
                <Button href="/docs/memory-table" type="text">
                  阅读文档
                </Button>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Card bordered className="h-full">
              <Space direction="vertical" size="small" className="w-full text-sm text-gray-600">
                <span>模板 · 旅店知识库</span>
                <span>● 表格仓库：酒馆菜单、库存、常客画像</span>
                <span>● 节点流程：点单处理、菜品更新、营销推送</span>
                <span>● 实时对话：AI 服务员同步库存状态</span>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm">
        <Title level={3}>快速开始</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card type="inner" title="1. 创建模板" bordered={false} className="h-full">
              <Paragraph className="text-gray-600">
                选择表格仓库与节点流程，定义表格属性，设定团队协作权限。
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card type="inner" title="2. 开启对话" bordered={false} className="h-full">
              <Paragraph className="text-gray-600">
                通过 AI 对话驱动表格增删改查，实时查看变更与版本记录。
              </Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card type="inner" title="3. 发布到市场" bordered={false} className="h-full">
              <Paragraph className="text-gray-600">
                选择仓库或流程类型，配置开放策略，让社区复用你的最佳实践。
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm">
        <Space direction="vertical" size="middle" className="w-full">
          <Title level={3}>开发工具包</Title>
          <Paragraph className="text-gray-600">
            使用 TableGit 与节点编辑器 SDK，将表格长期记忆能力集成至任意应用。
          </Paragraph>
          <Space size="middle">
            <Link href="/sdk/table-git">TableGit SDK</Link>
            <Link href="/sdk/node-editor">节点编辑器 SDK</Link>
            <Link href="/docs/node-editor">文档中心</Link>
          </Space>
        </Space>
      </Card>
    </Space>
  );
}
