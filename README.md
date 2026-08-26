# Content Hub — 内容聚合系统

> 一个基于 Next.js 14 的全栈内容聚合平台，支持小说创作/阅读、时事资讯、游戏内容等模块的统一管理与展示。

## 📌 项目状态

| 阶段 | 状态 |
|------|------|
| Phase 1 — 项目初始化 + 基础设施 | ✅ 完成 |
| Phase 2 — 认证系统 + 用户管理 | ✅ 完成 |
| Phase 3 — 小说模块 API + 页面（含阅读器视觉收尾） | ✅ 完成 |
| Phase 4 — 时事/游戏内容模块 | 🔲 待开始 |

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14（App Router） |
| 语言 | TypeScript（strict 模式，零 `any`） |
| 样式 | Tailwind CSS v4（`@tailwindcss/postcss`） |
| ORM | Prisma 5（单例缓存 `globalThis`） |
| 数据库 | PostgreSQL |
| 认证 | NextAuth.js v4（JWT 策略） |
| 包管理 | pnpm |
| 部署 | Docker / 自有服务器 |
| AI 辅助 | DeepSeek V4 Flash（省成本） |

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- pnpm ≥ 8
- PostgreSQL ≥ 14

### 安装

\`\`\`bash
# 克隆仓库
git clone <repo-url>
cd content-hub

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DATABASE_URL、NEXTAUTH_SECRET、NEXTAUTH_URL 等

# 初始化数据库
pnpm prisma migrate dev
pnpm prisma generate

# 启动开发服务器
pnpm dev
\`\`\`

打开 http://localhost:3000 即可访问。

### 生产构建

\`\`\`bash
pnpm build
pnpm start
\`\`\`

> ⚠️ **编码铁律**：\`pnpm build\` 完成后只 commit，不自动 merge，等人工 review。

## 📁 项目结构

\`\`\`
content-hub/
├── app/                    # Next.js App Router
│   ├── api/                # API 路由（除 auth/* 和公开 GET 外均需 session 校验）
│   │   ├── auth/           # NextAuth 认证端点
│   │   ├── novels/         # 小说 CRUD + 章节管理
│   │   └── reading-progress/ # 阅读进度记录
│   ├── novels/             # 小说模块页面
│   │   ├── [id]/           # 小说详情页
│   │   │   ├── chapters/
│   │   │   │   └── [chapterId]/
│   │   │   │       ├── edit/   # 章节编辑器
│   │   │   │       └── read/   # 阅读器页面
│   │   │   └── page.tsx
│   │   └── page.tsx        # 小说列表页
│   ├── login/              # 登录页
│   ├── globals.css         # 全局样式（含阅读器护眼主题）
│   └── layout.tsx
├── components/             # 公共组件
├── lib/                    # 工具函数
│   ├── prisma.ts           # Prisma 单例（globalThis 缓存）
│   ├── auth.ts             # NextAuth 配置
│   └── api.ts              # API 统一返回格式工具
├── prisma/
│   └── schema.prisma       # 数据库模型
├── middleware.ts            # 路由守卫（getToken 判角色）
├── Dockerfile
├── docker-compose.yml
└── package.json
\`\`\`

## 📖 功能概览

### 认证与权限

| 角色 | 权限 |
|------|------|
| \`ADMIN\` | 查看/管理所有内容，用户管理 |
| \`AUTHOR\` | 查看自己全部作品 + 他人已发布作品，可创建/编辑自己的小说和章节 |
| 游客 | 只读已发布（\`ONGOING\` / \`COMPLETED\`）内容 |

- NextAuth v4 JWT 策略，\`session\` callback 手动写入 \`role\`
- \`middleware.ts\` 用 \`getToken()\` 判断角色路由守卫
- 微信小程序端：自定义 credentials + header token（不支持 cookie）

### 小说模块

| 功能 | 说明 |
|------|------|
| 小说列表 | 网格布局、状态 badge、简介截断、作者信息 |
| 小说详情 | 两栏布局（封面 + 元信息 / 章节列表） |
| 章节编辑器 | 全宽 textarea + 毛玻璃 sticky 操作条 |
| 阅读器 | 护眼米黄底（\`#f6f4ec\`）+ 深灰衬线字（Noto Serif SC），隔离系统深色模式 |
| 阅读进度 | API 已建（\`/api/reading-progress\`），待前端接入 |

### 阅读器视觉规范

\`\`\`css
.reader-body    /* 护眼米黄底 #f6f4ec + 深灰字 #333，!important 隔离深色模式 */
.reader-title   /* 标题深灰 #222 */
.reader-meta    /* 弱化信息 #888 */
.reader-nav     /* 顶部导航：米黄底 + 无边框 + 悬停暖灰底 */
.reader-footer  /* 底部操作栏：同色系线条 + 透明按钮 */
\`\`\`

## 🔑 关键坑位备忘

| 坑 | 解决方案 |
|----|----------|
| NextAuth v4 session callback 不自动带 role | 手动 \`session.user.role = token.role\` |
| middleware 判角色 | 用 \`getToken()\` 而非 \`getServerSession()\` |
| Tailwind v4 PostCSS | 用 \`@tailwindcss/postcss\` 插件，非 \`tailwindcss\` |
| Tailwind v4 globals.css | 用 \`@import "tailwindcss";\`，不用 \`@tailwind\` 指令 |
| Prisma 客户端热重载重复实例化 | \`globalThis.prisma = db\` 单例缓存 |
| Phaser 3 客户端渲染 | \`dynamic import + { ssr: false }\` |
| DeepSeek Flash 返回 JSON | \`try-catch\` 降级处理 |
| RSS 采集 | 独立脚本 + PM2 守护进程 |
| API 统一返回格式 | \`{ success: boolean, data?: T, error?: string }\` |

## 📋 编码规范

- ✅ TypeScript strict 模式，**禁止 \`any\` / \`@ts-ignore\`**
- ✅ 所有 \`/api/*\` 路由（除 \`auth/*\` 和公开 GET）必须 \`getServerSession()\` 校验
- ✅ Prisma 查询用 \`select\` 显式指定字段，不返回敏感数据
- ✅ UI 组件优先 Tailwind 工具类，阅读器特殊样式走 \`globals.css\`
- ✅ Build 完成只 commit，不自动 merge

## 🐳 Docker 部署

\`\`\`bash
# 构建镜像
docker build -t content-hub .

# 启动（配合 .env 文件）
docker run -d --name content-hub -p 3000:3000 --env-file .env content-hub

# 或使用 docker-compose
docker-compose up -d
\`\`\`

## 🗺 后续规划

- [ ] Phase 4：时事内容模块（Schema + API + 列表/详情页）
- [ ] Phase 4：游戏内容模块
- [ ] 阅读进度前端接入（已在 API 层就绪）
- [ ] RSS 自动采集定时任务
- [ ] 微信小程序端

## 📄 License

Private / 内部项目
