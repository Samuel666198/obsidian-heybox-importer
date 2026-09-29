import * as https from "https";
import * as crypto from "crypto";

const API_BASE = "https://api.xiaoheihe.cn";

export interface HeyboxPost {
  title: string;
  content: string;
  comments: HeyboxComment[];
  commentsUnavailable: boolean;
  video?: string;
  tags: string[];
  link_id: string;
  create_at: string;
  community_id?: string;
  author: {
    username: string;
    avatar: string;
    userid: string;
  };
}

export interface HeyboxComment {
  author: string;
  content: string;
  likes: number;
  create_at?: string;
}

// ===== AES MixColumns =====
function Vm(e: number): number { return 128 & e ? 255 & (e << 1 ^ 27) : e << 1; }
function qm(e: number): number { return Vm(e) ^ e; }
function __$m(e: number): number { return qm(Vm(e)); }
function Ym(e: number): number { return __$m(qm(Vm(e))); }
function Gm(e: number): number { return Ym(e) ^ __$m(e) ^ qm(e); }
function Km(arr: number[]): number[] {
  var t = [0, 0, 0, 0];
  t[0] = Gm(arr[0]) ^ Ym(arr[1]) ^ __$m(arr[2]) ^ qm(arr[3]);
  t[1] = qm(arr[0]) ^ Gm(arr[1]) ^ Ym(arr[2]) ^ __$m(arr[3]);
  t[2] = __$m(arr[0]) ^ qm(arr[1]) ^ Gm(arr[2]) ^ Ym(arr[3]);
  t[3] = Ym(arr[0]) ^ __$m(arr[1]) ^ qm(arr[2]) ^ Gm(arr[3]);
  arr[0] = t[0]; arr[1] = t[1]; arr[2] = t[2]; arr[3] = t[3];
  return arr;
}

// ===== Sign algorithm =====
const TABLE = "AB45STUVWZEFGJ6CH01D237IXYPQRKLMN89";
function sv(s: string): string { var r = ""; for (var i = 0; i < s.length; i++) r += TABLE[s.charCodeAt(i) % TABLE.length]; return r; }
function av(s: string, n: number): string { var rt = TABLE.slice(0, n); var r = ""; for (var i = 0; i < s.length; i++) r += rt[s.charCodeAt(i) % rt.length]; return r; }

function ov(urlPath: string, timestamp: number, nonce: string): string {
  var cleanPath = "/" + urlPath.split("/").filter(function(x) { return x; }).join("/") + "/";
  var arrays = [av(String(timestamp), -2), sv(cleanPath), sv(nonce)];
  var interleaved = "";
  var maxLen = Math.max(arrays[0].length, arrays[1].length, arrays[2].length);
  for (var col = 0; col < maxLen; col++) {
    for (var i = 0; i < 3; i++) { if (col < arrays[i].length) interleaved += arrays[i][col]; }
  }
  interleaved = interleaved.slice(0, 20);
  var md5Hash = crypto.createHash("md5").update(interleaved).digest("hex");
  var last6 = md5Hash.slice(-6).split("").map(function(c) { return c.charCodeAt(); });
  var kmOut = Km(last6);
  var total = kmOut.reduce(function(s, v) { return s + v; }, 0);
  var a = String(total % 100); if (a.length < 2) a = "0" + a;
  return av(md5Hash.substring(0, 5), -4) + a;
}

function generateSignature(apiPath: string): { hkey: string; _time: number; nonce: string } {
  var t = Math.floor(Date.now() / 1000);
  var r = crypto.createHash("md5").update(String(t) + Math.random().toString()).digest("hex").toUpperCase();
  return { hkey: ov(apiPath, t + 1, r), _time: t, nonce: r };
}

// ===== HTTP helper =====
function apiGet(apiPath: string, params: Record<string, string>): Promise<any> {
  const sig = generateSignature(apiPath);
  const allParams: Record<string, string> = {
    os_type: "web", app: "heybox", client_type: "mobile", version: "999.0.4",
    x_client_type: "web", x_app: "heybox_website", x_os_type: "Windows", heybox_id: "-1",
    _time: String(sig._time), nonce: sig.nonce, hkey: sig.hkey,
    ...params,
  };
  const qs = Object.entries(allParams).map(function(e) { return encodeURIComponent(e[0]) + "=" + encodeURIComponent(e[1]); }).join("&");
  const url = API_BASE + apiPath + "?" + qs;

  return new Promise(function(resolve, reject) {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.xiaoheihe.cn/", "Origin": "https://www.xiaoheihe.cn",
      },
    }, function(res) {
      var data = "";
      res.on("data", function(c) { data += c; });
      res.on("end", function() {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Parse error: " + (e instanceof Error ? e.message : String(e)))); }
      });
    }).on("error", function(e) { reject(new Error("Request error: " + e.message)); });
  });
}

// ===== HTML → Markdown 转换 =====

/**
 * 将小黑盒正文 HTML 转换为 Markdown
 * HTML 中已包含图文混排的完整结构（<img> 在段落之间）
 * 策略：先提取 <img> 的 data-original 替换为 ![](url)，再清理其余标签
 */
function htmlToMarkdown(html: string): string {
  // 1. 替换 <img> 标签为 Markdown 图片 ![](data-original)
  html = html.replace(/<img[^>]*data-original="([^"]*)"[^>]*\/?>/g, function(match, url) { return "![](" + url + ")"; });

  // 2. 清理其余标签，保留段落结构
  return html
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<p[^>]*>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '\u0022').replace(/&#39;/g, '\u0027')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Fetch a Heybox post via link/tree + link/web/view
 */
// 简单内存缓存，避免重复请求同一个 link_id
var fetchCache: Record<string, HeyboxPost> = {};

const COMMENT_PAGE_SIZE = 20;

function getCommentLikes(comment: any): number {
  const values = [
    comment?.up,
    comment?.up_num,
    comment?.up_count,
    comment?.support_num,
    comment?.support_count,
    comment?.like_num,
    comment?.like_count,
  ];
  for (const value of values) {
    if (value == null || value === "") continue;
    const count = Number(value);
    if (Number.isFinite(count)) return count;
  }
  return 0;
}

function normalizeComment(comment: any): HeyboxComment | null {
  const content = String(comment?.text ?? comment?.content ?? "").trim();
  if (!content) return null;

  const createAt = comment?.create_at == null ? "" : String(comment.create_at);
  return {
    author: String(comment?.user?.username || comment?.user?.nickname || "匿名用户"),
    content,
    likes: getCommentLikes(comment),
    create_at: createAt || undefined,
  };
}

async function fetchHotComments(link_id: string, requestedLimit: number): Promise<HeyboxComment[]> {
  const commentLimit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0
    ? requestedLimit
    : 5;
  const comments: HeyboxComment[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; comments.length < commentLimit; page++) {
    const data = await apiGet("/bbs/app/link/tree", {
      link_id,
      is_first: page === 1 ? "1" : "0",
      page: String(page),
      index: "1",
      limit: String(COMMENT_PAGE_SIZE),
      owner_only: "0",
      h_src: "",
    });

    if (data.status === "show_captcha") throw new Error("请求过于频繁，请稍后再试");
    if (data.status !== "ok") throw new Error("Comment API error: " + (data.msg || "unknown"));

    if (!Array.isArray(data.result?.comments)) {
      throw new Error("Comment API response is missing the comments list");
    }
    const groups: any[] = data.result.comments;
    for (const group of groups) {
      const root = Array.isArray(group?.comment) ? group.comment[0] : group?.comment;
      const normalized = normalizeComment(root);
      if (!normalized) continue;

      const id = String(root?.comment_id ?? root?.commentid ?? root?.commentId ?? root?.id ?? "");
      if (id && seenIds.has(id)) continue;
      if (id) seenIds.add(id);
      comments.push(normalized);
    }

    if (groups.length < COMMENT_PAGE_SIZE) break;
  }

  return comments
    .map((comment, index) => ({ comment, index }))
    .sort((left, right) => right.comment.likes - left.comment.likes || left.index - right.index)
    .slice(0, commentLimit)
    .map(({ comment }) => comment);
}

export async function fetchPost(link_id: string, commentLimit: number = 5): Promise<HeyboxPost | null> {
  const normalizedLimit = Number.isSafeInteger(commentLimit) && commentLimit > 0 ? commentLimit : 5;
  const cacheKey = link_id + ":" + normalizedLimit;
  if (fetchCache[cacheKey]) return fetchCache[cacheKey];

  // Step 1: 获取元数据
  const treeData = await apiGet("/bbs/app/link/tree", { link_id });
  if (treeData.status === "show_captcha") throw new Error("请求过于频繁，请稍后再试");
  if (treeData.status !== "ok") throw new Error("API error: " + (treeData.msg || "unknown"));

  const link = treeData.result.link;
  if (!link) return null;

  // Step 2: 获取完整正文
  const numericId = link.linkid;
  const hSrc = Buffer.from("news_feeds_-1__link_id__" + numericId).toString("base64");

  var markdownContent = link.description || "";

  try {
    const webData = await apiGet("/bbs/app/link/web/view", {
      link_id: String(numericId),
      return_json: "1",
      index: "1",
      h_src: hSrc,
    });
    if (webData.status === "ok" && webData.result?.link?.content) {
      var contentBlocks = webData.result.link.content;
      // 第一个 block 通常包含完整的文字内容
      if (contentBlocks.length > 0 && (contentBlocks[0].type === "html" || contentBlocks[0].type === "text")) {
        markdownContent = htmlToMarkdown(contentBlocks[0].text || "");
      }
      // 剩余 block 中的图片追加到末尾
      for (var i = 1; i < contentBlocks.length; i++) {
        if (contentBlocks[i].type === "img" && contentBlocks[i].url) {
          var cleanUrl = contentBlocks[i].url.replace(/%3E$/, "").replace(/>$/, "");
          markdownContent += "\n\n![](" + cleanUrl + ")";
        }
      }
    }
  } catch (_e) {
    // fallback to description
  }

  // Step 3: 视频
  var video: string | undefined;
  const h264 = link.video?.media?.stream?.h264;
  if (h264 && h264.length > 0) video = h264[0].master_url;
  if (!video) {
    const h265 = link.video?.media?.stream?.h265;
    if (h265 && h265.length > 0) video = h265[0].master_url;
  }

  // Tags
  var tags: string[] = (link.content_tags || []).map(function(t: any) { return t.text || ""; }).filter(function(t: string) { return t; });

  let comments: HeyboxComment[] = [];
  let commentsUnavailable = false;
  try {
    comments = await fetchHotComments(link_id, normalizedLimit);
  } catch (_e) {
    commentsUnavailable = true;
  }

  const post = {
    title: link.title || "Untitled",
    content: markdownContent,
    comments,
    commentsUnavailable,
    video,
    tags,
    link_id,
    create_at: String(link.create_at || ""),
    community_id: link.community_id ? String(link.community_id) : undefined,
    author: {
      username: link.user?.username || "Unknown",
      avatar: link.user?.avatar || "",
      userid: link.user?.userid || "",
    },
  };
  if (!commentsUnavailable) fetchCache[cacheKey] = post;
  return post;
}
