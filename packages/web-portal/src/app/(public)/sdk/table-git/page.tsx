"use client";

import { CodeOutlined, DownloadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Row, Space, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

const quickLinks = [
  {
    label: "GitHub 仓库",
    href: "https://github.com/muyoou/table-git",
    description: "浏览源代码与贡献指南"
  },
  {
    label: "API 文档",
    href: "/doc/api-reference",
    description: "核心对象与运行时说明"
  }
];

const featureList = [
  "Cell 级别版本控制，支持结构变更",
  "可嵌入任何环境的 TypeScript SDK",
  "配套 CLI 与内存引擎，实现快速调试"
];

export default function TableGitSdkPage() {
  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>TableGit SDK</Title>
        <Paragraph className="text-gray-600">
          面向开发者的表格版本控制工具包，为构建自定义的长期记忆服务提供底层能力。
        </Paragraph>
      </Space>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card className="shadow-sm">
            <Title level={3}>快速开始</Title>
            <Paragraph className="text-gray-600">
              在 web-portal 中，我们通过 `@memory-engine` 封装 TableGit SDK，并结合 Supabase 提供认证与数据同步。
            </Paragraph>
            <Divider />
            <Space direction="vertical" size="small" className="text-gray-600">
              {featureList.map((item) => (
                <Text key={item}>• {item}</Text>
              ))}
            </Space>
            <Space className="mt-6">
              <Button icon={<DownloadOutlined />} type="primary">
                下载 SDK
              </Button>
              <Button icon={<CodeOutlined />} href="/doc/advanced-topics" target="_blank">
                高级用法
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow-sm" title="资源">
            <Space direction="vertical" size="middle" className="w-full">
              {quickLinks.map((link) => (
                <div key={link.href} className="flex flex-col">
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-primary">
                    {link.label}
                  </a>
                  <Text className="text-gray-500">{link.description}</Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
