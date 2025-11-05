"use client";

import { useState } from "react";
import { Button, Card, Divider, Radio, Space, Typography } from "antd";

const { Title, Paragraph, Text } = Typography;

const modes = [
  { label: "表格视图", value: "grid" },
  { label: "差异视图", value: "diff" }
];

type RadioChange = { target: { value?: string } };

export default function TableEditorPage() {
  const [mode, setMode] = useState<string>("grid");

  return (
    <Space direction="vertical" size="large" className="w-full">
      <Space direction="vertical" size="small">
        <Title level={2}>表格编辑器</Title>
        <Paragraph className="text-gray-600">
          此视图将集成第三方表格组件，并通过 `@memory-engine` 调用提交、撤销与 diff 接口。
        </Paragraph>
      </Space>
      <Card className="shadow-sm">
        <Space className="mb-4 w-full items-center justify-between">
          <Radio.Group
            options={modes}
            value={mode}
            onChange={(event: RadioChange) => setMode(event.target.value ?? mode)}
          />
          <Space>
            <Button>暂存</Button>
            <Button type="primary">提交</Button>
          </Space>
        </Space>
        {mode === "grid" ? (
          <div className="grid h-96 place-items-center rounded-lg border border-dashed border-gray-300">
            <Text type="secondary">表格组件占位</Text>
          </div>
        ) : (
          <Space direction="vertical" size="small" className="w-full">
            <Text strong>Diff 示例</Text>
            <Card bordered>
              <Paragraph className="text-gray-600">
                - 鸡尾酒：30 → 50 <br />- 葡萄酒：40 → 45
              </Paragraph>
            </Card>
          </Space>
        )}
        <Divider />
        <Paragraph className="text-gray-500 text-sm">
          未来将在此处展示提交历史、冲突提示与版本对比能力。
        </Paragraph>
      </Card>
    </Space>
  );
}
