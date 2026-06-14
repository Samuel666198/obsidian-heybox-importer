/**
 * URL 解析模块 - 从小黑盒分享链接中提取 link_id
 */

export interface ParsedLink {
  link_id: string;
  community_id?: string;
}

/**
 * 支持的链接格式:
 * 1. 社区帖子长链: https://www.xiaoheihe.cn/community/{community_id}/list/{link_id}
 * 2. 短链分享: https://api.xiaoheihe.cn/v3/bbs/app/api/web/share?link_id={link_id}
 * 3. App分享: https://api.xiaoheihe.cn/v3/bbs/app/api/web/share?h_camp=link&...&link_id={link_id}
 */
export function parseURL(text: string): ParsedLink | null {
  // 提取 URL
  const urlMatch = text.match(
    /https?:\/\/[^\s]+/
  );
  if (!urlMatch) return null;
  const url = urlMatch[0];

  // 格式1: /community/{community_id}/list/{link_id}
  const communityMatch = url.match(
    /xiaoheihe\.cn\/community\/(\d+)\/list\/(\d+)/
  );
  if (communityMatch) {
    return {
      link_id: communityMatch[2],
      community_id: communityMatch[1],
    };
  }

  // 格式2&3: share API 中的 link_id 参数
  const shareMatch = url.match(/[?&]link_id=([a-zA-Z0-9]+)/);
  if (shareMatch) {
    return { link_id: shareMatch[1] };
  }

  // 格式4: /app/bbs/link/{link_id}
  const bbsMatch = url.match(/xiaoheihe\.cn\/app\/bbs\/link\/([a-zA-Z0-9]+)/);
  if (bbsMatch) {
    return { link_id: bbsMatch[1] };
  }

  return null;
}