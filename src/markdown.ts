import type { HeyboxPost } from "./fetcher";

export interface MarkdownOptions {
  includeTags: boolean;
}

export function buildMarkdown(
  post: HeyboxPost,
  opts: MarkdownOptions
): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push("title: \"" + escapeYaml(post.title) + "\"");
  if (post.author.username) {
    lines.push("author: \"" + escapeYaml(post.author.username) + "\"");
  }
  lines.push("link_id: " + post.link_id);
  if (post.community_id) {
    lines.push("community_id: " + post.community_id);
  }
  if (post.create_at) {
    lines.push("date: " + post.create_at);
  }
  if (post.tags.length > 0 && opts.includeTags) {
    lines.push("tags:");
    for (const tag of post.tags) {
      lines.push("  - " + escapeYaml(tag));
    }
  }
  if (post.video) {
    lines.push("video: " + post.video);
  }
  lines.push("---");
  lines.push("");

  // content 已是完整的图文交错了 Markdown
  if (post.content) {
    lines.push(post.content);
    lines.push("");
  }

  if (post.comments?.length) {
    lines.push("## 热门评论");
    lines.push("");
    post.comments.forEach((comment, index) => {
      const createdAt = comment.create_at ? " · " + comment.create_at : "";
      lines.push(`${index + 1}. ${comment.author}（👍 ${comment.likes}${createdAt}）：`);
      lines.push("");
      for (const line of comment.content.replace(/\r\n?/g, "\n").split("\n")) {
        lines.push("   > " + line);
      }
      lines.push("");
    });
  }

  if (post.video) {
    lines.push("> 📹 [Video](" + post.video + ")");
    lines.push("");
  }

  lines.push("> Source: [Heybox](https://www.xiaoheihe.cn/app/bbs/link/" + post.link_id + ")");
  return lines.join("\n");
}

function escapeYaml(str: string): string {
  return str.replace(/"/g, '\\"');
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 200);
}
