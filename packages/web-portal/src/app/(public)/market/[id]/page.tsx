import { notFound } from "next/navigation";
import { MarketDetailContent } from "./market-detail-content";

const marketItems = {
  "tavern-memory": {
    name: "酒馆记忆模板",
    type: "混合",
    allow: "Clone + Merge",
    tags: ["餐饮", "节点流程"],
    disclaimer: "商业化使用需保留原作者署名。",
    readme: `# 酒馆记忆模板\n\n- 包含库存、菜单、会员三张表格\n- 预置点单处理与营销推送流程\n- 支持市场合并更新`
  },
  "crm-table": {
    name: "CRM 客户仓库",
    type: "纯仓库",
    allow: "Clone",
    tags: ["销售", "AI 对话"],
    disclaimer: "可用于商业项目，无需额外授权。",
    readme: `# CRM 仓库\n\n- 标准客户信息结构\n- 与 AI 对话提示词联动\n- 提供阶段标签与跟进记录`
  },
  "marketing-flow": {
    name: "营销自动化流程",
    type: "纯流程",
    allow: "Merge",
    tags: ["营销", "自动化"],
    disclaimer: "仅允许合并，禁止直接克隆发布。",
    readme: `# 营销流程\n\n- 支持邮件、短信与Webhook\n- 内置节假日模板\n- 可对接任意表格仓库`
  }
} satisfies Record<string, {
  name: string;
  type: string;
  allow: string;
  tags: string[];
  disclaimer: string;
  readme: string;
}>;

export type MarketDetailPageProps = {
  params: { id: string };
};

export default function MarketDetailPage({ params }: MarketDetailPageProps) {
  const detail = marketItems[params.id as keyof typeof marketItems];

  if (!detail) {
    notFound();
  }

  return <MarketDetailContent detail={detail} />;
}
