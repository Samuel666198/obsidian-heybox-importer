# Heybox Importer - Obsidian 插件

将小黑盒（Heybox）社区的图文帖子一键导入为 Markdown 笔记。

## 功能

- 支持小黑盒多种分享链接格式
- 自动提取帖子标题、作者、正文、图片、标签、视频
- 正文按原始图文顺序交错排列
- 保存按点赞数排序的热门评论，默认 5 条，可在设置中调整
- 支持标签开关
- 防重复请求缓存
- 导入频率限制友好提示

## 项目结构

```
obsidian-heybox-importer/
├── src/
│   ├── fetcher.ts     # API 签名、请求、HTML→Markdown 转换
│   ├── markdown.ts    # Markdown 生成（frontmatter + 正文）
│   ├── parser.ts      # URL 解析（4 种链接格式）
│   └── settings.ts    # 设置面板
├── deploy/
│   ├── main.js        # 编译产物（部署到 Obsidian）
│   ├── manifest.json
│   └── styles.css
├── main.ts            # 插件入口
├── scripts/sign.js    # 独立签名脚本（参考用）
├── package.json
└── README.md
```

## 构建

```bash
npm install
npm run build
```

将 `deploy/` 目录复制到 Obsidian 的 `.obsidian/plugins/heybox-importer/`。

## 使用

1. 在设置中配置默认保存文件夹、标签开关和热门评论数量
2. 点击 Ribbon 图标或运行命令 "Import Heybox post"
3. 粘贴小黑盒分享链接
4. 自动生成 Markdown 文件

热门评论数量默认为 5 条；如果文章可获取的评论不足设置数量，则保存全部可获取评论。

## 依赖

- 纯 Node 内置模块（https, crypto），无外部运行时依赖
- 构建工具：esbuild, TypeScript
