"use client";

/**
 * Create New Template Page
 * 
 * Page for creating a new template with table repository and flows
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Space, Card, message, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { RepositoryManager } from '@table-git/memory-engine';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // In a real implementation, this would be a global singleton or context
  const repoManager = new RepositoryManager();

  const handleSubmit = async (values: {
    name: string;
    description?: string;
    tableName?: string;
    tableDescription?: string;
  }) => {
    setLoading(true);
    
    try {
      // Create repository
      const repo = repoManager.createRepository({
        name: values.name,
        metadata: {
          tableName: values.tableName || values.name,
          tableDescription: values.tableDescription || values.description
        }
      });

      // In a real implementation, you would:
      // 1. Get current user ID from auth context
      // 2. Call TemplateService.create() with the repository state
      // 3. Redirect to the template detail page
      
      // Mock implementation:
      message.success('Template created successfully!');
      
      // Redirect to templates list
      setTimeout(() => {
        router.push('/console/templates');
      }, 1000);
      
    } catch (error) {
      console.error('Failed to create template:', error);
      message.error('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>Create New Template</Title>
          <Paragraph className="text-gray-600">
            Templates combine a table repository with node editor flows to create reusable memory structures.
          </Paragraph>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Template Name"
              name="name"
              rules={[
                { required: true, message: 'Please enter a template name' }
              ]}
            >
              <Input placeholder="e.g., Customer Database" />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
            >
              <TextArea
                rows={3}
                placeholder="Describe the purpose of this template"
              />
            </Form.Item>

            <Title level={4}>Table Repository</Title>

            <Form.Item
              label="Table Name"
              name="tableName"
            >
              <Input placeholder="Name for the table (optional)" />
            </Form.Item>

            <Form.Item
              label="Table Description"
              name="tableDescription"
            >
              <TextArea
                rows={2}
                placeholder="Describe what this table stores"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  Create Template
                </Button>
                <Button onClick={() => router.back()}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Next Steps" size="small">
          <Paragraph>
            After creating the template, you can:
          </Paragraph>
          <ul>
            <li>Add and configure node editor flows</li>
            <li>Edit the table structure and add initial data</li>
            <li>Create conversations based on this template</li>
            <li>Share the template in the marketplace</li>
          </ul>
        </Card>
      </Space>
    </div>
  );
}
