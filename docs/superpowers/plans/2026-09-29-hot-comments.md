# 热门评论保存 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 导入小黑盒文章时，将用户设定数量的热门评论写入 Obsidian 笔记，默认 5 条。

**Architecture:** 在现有 fetcher 请求层增加评论读取和规范化；插件设置提供目标数量，帖子对象传递可选评论及获取失败状态；Markdown 生成器输出独立热门评论区块，评论读取失败不影响文章导入。

**Tech Stack:** TypeScript、Obsidian API、Node.js 内置 `https`/`crypto`、esbuild。

**Spec:** `docs/superpowers/specs/2026-09-29-hot-comments-design.md`

## Global Constraints

- 每篇文章默认保存点赞最高的 5 条评论。
- 用户可以在插件设置中自行调整目标数量。
- 若实际可获取评论少于目标数量，则保存全部可获取评论。
- 评论请求失败时仍完成文章导入；跳过评论并提示用户评论未能获取。
- 既有文章正文、媒体、标签和来源链接输出保持兼容。
- 通过项目现有构建命令 `npm run build` 验证 TypeScript 和打包产物。

---

## 文件结构与职责

- `src/fetcher.ts`：新增评论规范化类型和 API 读取；现有帖子请求继续作为导入主流程。
- `src/settings.ts`：新增并持久化热门评论数量设置项及输入校验。
- `src/markdown.ts`：将评论渲染为 Markdown 区块。
- `main.ts`：把设置传给 fetcher，并在评论读取失败时反馈，同时继续保存帖子。
- `README.md`：补充评论保存能力和数量设置说明。

## Task 1: 确认并实现评论 API 获取

**Files:**
- Modify: `src/fetcher.ts`

**Interfaces:**
- Produces `HeyboxComment`: `{ author: string; content: string; likes: number; create_at?: string }`。
- `HeyboxPost` 增加 `comments: HeyboxComment[]` 与 `commentsUnavailable: boolean`。
- 帖子读取入口变为 `fetchPost(link_id: string, commentLimit: number): Promise<HeyboxPost | null>`。

- [ ] **Step 1: 从真实响应确认评论读取契约**

  使用现有帖子导入请求签名和一个公开文章链接，检查文章详情页发出的首层评论请求。记录请求路径、必要参数、成功响应中的评论数组、点赞字段以及分页游标；不得在日志或 fixture 中记录用户 Cookie 或令牌。用返回数据确认该请求能读出至少一篇文章的评论。

- [ ] **Step 2: 在 fetcher 中实现评论读取和规范化**

  复用 `apiGet` 与现有签名参数，不新增运行时依赖。按已确认的请求契约读取评论页，规范化作者、文本、点赞数和可用的创建时间；遇到分页时继续请求，直到评论数量达到 `commentLimit` 或响应表明没有下一页。按点赞数降序排序并截取目标数量；若返回总数不足则返回全部。设置正整数校验，非法值回退到 5。

- [ ] **Step 3: 将评论失败隔离在补充数据路径**

  在 `fetchPost` 中先完成现有文章正文、媒体和标签读取，再单独尝试读取评论。评论请求或响应解析抛错时返回 `comments: []` 和 `commentsUnavailable: true`；成功但无评论时返回空数组和 `false`。原有文章 API 错误仍按当前方式抛出。

- [ ] **Step 4: 运行项目构建**

  Run: `npm run build`
  Expected: TypeScript 编译与 esbuild 打包成功。

## Task 2: 设置数量、生成笔记并更新说明

**Files:**
- Modify: `src/settings.ts`
- Modify: `src/markdown.ts`
- Modify: `main.ts`
- Modify: `README.md`

**Interfaces:**
- `HeyboxImporterSettings` 增加 `hotCommentLimit: number`，默认值为 `5`。
- 设置输入修改时只保存大于零的整数；旧配置缺字段或值非法时使用 `5`。
- `buildMarkdown(post, opts)` 从 `post.comments` 读取评论，不更改现有正文和来源链接接口。

- [ ] **Step 1: 增加默认值、旧配置兼容和设置输入**

  在 `DEFAULT_SETTINGS` 中增加 `hotCommentLimit: 5`。在 `loadSettings` 合并持久化数据后，将非正整数、非数值和缺省值归一为 5。设置页添加数字输入，标题为“热门评论数量”，说明默认抓取点赞最高的评论；有效变更保存设置。

- [ ] **Step 2: 在 Markdown 中渲染热门评论**

  在正文之后、Source 链接之前加入 `## 热门评论` 区块。评论按 `likes` 降序显示为有序列表，每项格式为 `作者（👍 点赞数）：评论内容`；若有创建时间，将其作为该项的补充元数据。文本中的换行保留为 Markdown 段落。评论数组为空时不输出标题或空列表。

- [ ] **Step 3: 串接设置并反馈评论获取失败**

  `main.ts` 使用 `this.plugin.settings.hotCommentLimit` 调用 `fetchPost`。成功保存文章后，如果 `commentsUnavailable` 为真，显示文章已保存、评论未获取的提示；如果评论读取成功，保持现有导入成功提示。评论失败不得跳过 Markdown 生成或文件保存。

- [ ] **Step 4: 更新 README 功能和设置说明**

  在功能列表中说明可保存按点赞排序的热门评论；在设置说明中写明默认数量为 5、可自行调整、可获取数量不足时保存全部。

- [ ] **Step 5: 运行项目构建并检查产物**

  Run: `npm run build`
  Expected: 构建成功，`deploy/main.js` 包含评论读取与渲染更新，生成的 `deploy/` 文件符合 README 中部署方式。

## 自查

- 需求覆盖：默认值、用户可调数量、评论不足时保存全部、评论失败不阻断正文导入、无评论不显示空区块、原有输出兼容均在 Task 1 和 Task 2 中覆盖。
- 占位符检查：计划没有 TBD/TODO；评论 API 契约被明确列为 Task 1 的首个执行步骤，以真实响应确认后再编码。
- 类型一致性：Task 1 产出的 `HeyboxComment`、`comments`、`commentsUnavailable` 与 Task 2 的设置及 Markdown 渲染接口一致。
