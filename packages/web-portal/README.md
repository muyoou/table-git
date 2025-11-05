# Web Portal

基于 Next.js 的长期记忆平台前端，整合记忆表格、节点编辑器、市场与控制台功能模块。

## 技术栈
- Next.js 14 (App Router)
- React 18
- Ant Design 5
- Tailwind CSS 3
- Supabase (Auth + Postgres + Storage)
- TanStack Query / Zustand（数据与状态管理）

## 本地开发
1. 安装依赖：`npm install`
2. 复制 `.env.example` 为 `.env.local` 并配置 Supabase 信息。
3. 运行开发服务器：`npm run dev`
4. 访问 `http://localhost:3000`

## 项目结构
```
src/
  app/              # Next.js App Router 路由与页面
  components/       # 可复用组件（导航、布局、占位等）
  shared/           # 配置、工具、hooks 等共享代码
```

## 与业务包的集成
- `@memory-engine/*` 指向 `packages/table-memory-engine/src`
- `@node-editor/*` 指向 `packages/table-node-editor/src`
- 通过本地 workspace 引用实现无缝开发与调试

后续将补充实际的 API 调用、组件集成与权限控制逻辑。
