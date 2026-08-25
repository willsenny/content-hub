# AGENTS.md

> 本文件是 AI 编码助手的最高优先级上下文。每次新会话必须首先读取并严格遵守。

---

## 一、项目概况

- 项目名称：content-hub（内容聚合平台）
- 当前阶段：Phase 1 — 数据库 Schema + Prisma 客户端（小说模块优先）
- 产品定位：小说（人机共创）+ 时事（AI采集+人工编排）+ 游戏（Phaser自研）的内容聚合系统，含 Web + 公众号H5 + 微信小程序三端。

---

## 二、技术栈（锁死，不可擅自替换）

前端框架：Next.js 14（App Router），全栈一体，API Routes 即后端
语言：TypeScript（strict 模式），不允许 any，不允许 @ts-ignore
样式：Tailwind CSS + Shadcn/ui，组件放 @/components/ui
ORM：Prisma 5 + PostgreSQL 15，Schema 唯一数据源
认证：NextAuth.js v4，GitHub + 邮箱，JWT 策略
AI：DeepSeek V4 Flash（仅此一个模型），峰谷计价，所有 AI 调用走封装 service
游戏：Phaser 3.70+，必须 dynamic import + { ssr: false }
包管理：pnpm 9
部署：Docker + 自有服务器（非 Vercel，因需长驻定时任务）

---

## 三、目录结构

content-hub/
  .opencode/
    config.json
    commands/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  public/
  src/
    app/
      (auth)/
      (dashboard)/
      api/
        auth/
        novels/
        news/
        games/
        cron/
      novels/
      news/
      games/
      admin/
      layout.tsx
      page.tsx
    components/
      ui/
      novels/
      news/
      games/
      shared/
    lib/
      auth.ts
      prisma.ts
      deepseek.ts
      rss.ts
      utils.ts
    types/
    hooks/
    stores/
    middleware.ts
  scripts/
    fetch-news.ts
  .env.example
  docker-compose.yml
  Dockerfile
  AGENTS.md
  package.json

---

## 四、用户角色

USER：普通用户，阅读/玩游戏/收藏
AUTHOR：作者，上述 + 创建编辑发布自己的小说 + AI生成章节
ADMIN：管理员，全部权限 + 时事编排 + 用户管理

枚举：Role { USER, AUTHOR, ADMIN }，默认 USER
User 表预留 openid、unionid 字段（微信接入用，允许 null）

---

## 五、当前阶段：Phase 1 执行规则

当前只做：数据库 Schema + Prisma 客户端 + 基础连接验证
不做：API 实现、前端页面、认证逻辑、AI 调用

验收标准：
- prisma/schema.prisma 包含所有核心模型
- npx prisma migrate dev --name init 成功
- npx prisma generate 成功
- src/lib/prisma.ts 导出单例
- pnpm dev 启动无报错
- User 表含 openid、unionid（允许 null）

Phase 1 完成后下一步：Phase 2 NextAuth 认证体系

---

## 六、DeepSeek V4 Flash 约束

唯一模型：deepseek-v4-flash
Temperature：创作 0.7-0.9 / 结构化 0.12 / 审核 0.0
Max Tokens：常规 4096，小说章节 8192
超时：60s，重试 2 次（指数退避），第三次失败返回降级文案

所有 AI 调用必须经过 src/lib/deepseek.ts 统一封装
禁止在页面或 API Route 中直接 fetch DeepSeek API
封装必须包含：重试、超时、降级返回、token 用量日志

峰谷策略：
- 高峰 09-12、14-18：只做小修小补
- 空闲时段+周末：跑大块生成任务
- 稳定 prompt 尽量复用以命中缓存（输入 0.05/百万token）

---

## 七、opencode 使用规则

Plan 模式：架构决策、Schema 设计、方案对比，只读不写文件
Build 模式：写代码、跑命令，每次只做一个微任务

会话管理：
- 每个 Phase 开 /new 新会话
- 新会话开头必须 @AGENTS.md
- .opencodeignore 包含：node_modules、.next、dist、*.log

提交规范：
- git commit -m "type(scope): description"
- type: feat / fix / refactor / docs / chore / test
- 每个功能开 feat/xxx 分支，完成后 merge

---

## 八、编码铁律

1. TypeScript strict，禁止 any、@ts-ignore
2. 所有密钥走 process.env，.env 不进 git
3. 所有 /api/* 路由（除 auth/* 和公开 GET）必须 getServerSession() 校验
4. Prisma 单例用 globalThis 缓存
5. Phaser 组件必须 dynamic import + { ssr: false }
6. AI prompt、RSS URL、游戏配置不硬编码
7. API 统一返回 { success: boolean, data?: T, error?: string }
8. Build 完成只 commit，不自动 merge，等人工 review

---

## 九、关键坑位备忘

- NextAuth v4 + App Router：session callback 必须手动把 role 写回 session.user.role
- middleware.ts 用 getToken() 判角色，不能用 useSession()
- RSS 采集用 scripts/ + node-cron + PM2 独立跑
- 微信小程序不支持 cookie，NextAuth 需自定义 credentials + header token
- Phaser 3 不能用 SSR
- DeepSeek Flash 偶尔返回不完整 JSON，解析必须 try-catch + 降级

---

## 十、Phase 进度

Phase 0：仓库+骨架+AGENTS.md — 进行中
Phase 1：Schema+Prisma 客户端 — 当前
Phase 2：NextAuth — 待开始
Phase 3：小说模块 — 待开始
Phase 4：时事模块 — 待开始
Phase 5：游戏模块 — 待开始
Phase 6：管理后台 — 待开始
Phase 7：微信双端 — 待开始
Phase 8：部署 — 待开始
