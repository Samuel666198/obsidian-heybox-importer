"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => HeyboxImporterPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/parser.ts
function parseURL(text) {
  const urlMatch = text.match(
    /https?:\/\/[^\s]+/
  );
  if (!urlMatch) return null;
  const url = urlMatch[0];
  const communityMatch = url.match(
    /xiaoheihe\.cn\/community\/(\d+)\/list\/(\d+)/
  );
  if (communityMatch) {
    return {
      link_id: communityMatch[2],
      community_id: communityMatch[1]
    };
  }
  const shareMatch = url.match(/[?&]link_id=([a-zA-Z0-9]+)/);
  if (shareMatch) {
    return { link_id: shareMatch[1] };
  }
  const bbsMatch = url.match(/xiaoheihe\.cn\/app\/bbs\/link\/([a-zA-Z0-9]+)/);
  if (bbsMatch) {
    return { link_id: bbsMatch[1] };
  }
  return null;
}

// src/fetcher.ts
var https = __toESM(require("https"));
var crypto = __toESM(require("crypto"));
var API_BASE = "https://api.xiaoheihe.cn";
function Vm(e) {
  return 128 & e ? 255 & (e << 1 ^ 27) : e << 1;
}
function qm(e) {
  return Vm(e) ^ e;
}
function __$m(e) {
  return qm(Vm(e));
}
function Ym(e) {
  return __$m(qm(Vm(e)));
}
function Gm(e) {
  return Ym(e) ^ __$m(e) ^ qm(e);
}
function Km(arr) {
  var t = [0, 0, 0, 0];
  t[0] = Gm(arr[0]) ^ Ym(arr[1]) ^ __$m(arr[2]) ^ qm(arr[3]);
  t[1] = qm(arr[0]) ^ Gm(arr[1]) ^ Ym(arr[2]) ^ __$m(arr[3]);
  t[2] = __$m(arr[0]) ^ qm(arr[1]) ^ Gm(arr[2]) ^ Ym(arr[3]);
  t[3] = Ym(arr[0]) ^ __$m(arr[1]) ^ qm(arr[2]) ^ Gm(arr[3]);
  arr[0] = t[0];
  arr[1] = t[1];
  arr[2] = t[2];
  arr[3] = t[3];
  return arr;
}
var TABLE = "AB45STUVWZEFGJ6CH01D237IXYPQRKLMN89";
function sv(s) {
  var r = "";
  for (var i = 0; i < s.length; i++) r += TABLE[s.charCodeAt(i) % TABLE.length];
  return r;
}
function av(s, n) {
  var rt = TABLE.slice(0, n);
  var r = "";
  for (var i = 0; i < s.length; i++) r += rt[s.charCodeAt(i) % rt.length];
  return r;
}
function ov(urlPath, timestamp, nonce) {
  var cleanPath = "/" + urlPath.split("/").filter(function(x) {
    return x;
  }).join("/") + "/";
  var arrays = [av(String(timestamp), -2), sv(cleanPath), sv(nonce)];
  var interleaved = "";
  var maxLen = Math.max(arrays[0].length, arrays[1].length, arrays[2].length);
  for (var col = 0; col < maxLen; col++) {
    for (var i = 0; i < 3; i++) {
      if (col < arrays[i].length) interleaved += arrays[i][col];
    }
  }
  interleaved = interleaved.slice(0, 20);
  var md5Hash = crypto.createHash("md5").update(interleaved).digest("hex");
  var last6 = md5Hash.slice(-6).split("").map(function(c) {
    return c.charCodeAt();
  });
  var kmOut = Km(last6);
  var total = kmOut.reduce(function(s, v) {
    return s + v;
  }, 0);
  var a = String(total % 100);
  if (a.length < 2) a = "0" + a;
  return av(md5Hash.substring(0, 5), -4) + a;
}
function generateSignature(apiPath) {
  var t = Math.floor(Date.now() / 1e3);
  var r = crypto.createHash("md5").update(String(t) + Math.random().toString()).digest("hex").toUpperCase();
  return { hkey: ov(apiPath, t + 1, r), _time: t, nonce: r };
}
function apiGet(apiPath, params) {
  const sig = generateSignature(apiPath);
  const allParams = {
    os_type: "web",
    app: "heybox",
    client_type: "mobile",
    version: "999.0.4",
    x_client_type: "web",
    x_app: "heybox_website",
    x_os_type: "Windows",
    heybox_id: "-1",
    _time: String(sig._time),
    nonce: sig.nonce,
    hkey: sig.hkey,
    ...params
  };
  const qs = Object.entries(allParams).map(function(e) {
    return encodeURIComponent(e[0]) + "=" + encodeURIComponent(e[1]);
  }).join("&");
  const url = API_BASE + apiPath + "?" + qs;
  return new Promise(function(resolve, reject) {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.xiaoheihe.cn/",
        "Origin": "https://www.xiaoheihe.cn"
      }
    }, function(res) {
      var data = "";
      res.on("data", function(c) {
        data += c;
      });
      res.on("end", function() {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Parse error: " + (e instanceof Error ? e.message : String(e))));
        }
      });
    }).on("error", function(e) {
      reject(new Error("Request error: " + e.message));
    });
  });
}
function htmlToMarkdown(html) {
  html = html.replace(/<img[^>]*data-original="([^"]*)"[^>]*\/?>/g, function(match, url) {
    return "![](" + url + ")";
  });
  return html.replace(/<br\s*\/?>/g, "\n").replace(/<\/p>/g, "\n\n").replace(/<p[^>]*>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
var fetchCache = {};
async function fetchPost(link_id) {
  if (fetchCache[link_id]) return fetchCache[link_id];
  const treeData = await apiGet("/bbs/app/link/tree", { link_id });
  if (treeData.status === "show_captcha") throw new Error("\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5");
  if (treeData.status !== "ok") throw new Error("API error: " + (treeData.msg || "unknown"));
  const link = treeData.result.link;
  if (!link) return null;
  const numericId = link.linkid;
  const hSrc = Buffer.from("news_feeds_-1__link_id__" + numericId).toString("base64");
  var markdownContent = link.description || "";
  try {
    const webData = await apiGet("/bbs/app/link/web/view", {
      link_id: String(numericId),
      return_json: "1",
      index: "1",
      h_src: hSrc
    });
    if (webData.status === "ok" && webData.result?.link?.content) {
      var contentBlocks = webData.result.link.content;
      if (contentBlocks.length > 0 && (contentBlocks[0].type === "html" || contentBlocks[0].type === "text")) {
        markdownContent = htmlToMarkdown(contentBlocks[0].text || "");
      }
      for (var i = 1; i < contentBlocks.length; i++) {
        if (contentBlocks[i].type === "img" && contentBlocks[i].url) {
          var cleanUrl = contentBlocks[i].url.replace(/%3E$/, "").replace(/>$/, "");
          markdownContent += "\n\n![](" + cleanUrl + ")";
        }
      }
    }
  } catch (_e) {
  }
  var video;
  const h264 = link.video?.media?.stream?.h264;
  if (h264 && h264.length > 0) video = h264[0].master_url;
  if (!video) {
    const h265 = link.video?.media?.stream?.h265;
    if (h265 && h265.length > 0) video = h265[0].master_url;
  }
  var tags = (link.content_tags || []).map(function(t) {
    return t.text || "";
  }).filter(function(t) {
    return t;
  });
  return {
    title: link.title || "Untitled",
    content: markdownContent,
    video,
    tags,
    link_id,
    create_at: String(link.create_at || ""),
    community_id: link.community_id ? String(link.community_id) : void 0,
    author: {
      username: link.user?.username || "Unknown",
      avatar: link.user?.avatar || "",
      userid: link.user?.userid || ""
    }
  };
}

// src/markdown.ts
function buildMarkdown(post, opts) {
  const lines = [];
  lines.push("---");
  lines.push('title: "' + escapeYaml(post.title) + '"');
  if (post.author.username) {
    lines.push('author: "' + escapeYaml(post.author.username) + '"');
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
  if (post.content) {
    lines.push(post.content);
    lines.push("");
  }
  if (post.video) {
    lines.push("> \u{1F4F9} [Video](" + post.video + ")");
    lines.push("");
  }
  lines.push("> Source: [Heybox](https://www.xiaoheihe.cn/app/bbs/link/" + post.link_id + ")");
  return lines.join("\n");
}
function escapeYaml(str) {
  return str.replace(/"/g, '\\"');
}
function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-").slice(0, 200);
}

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  defaultFolder: "Heybox Notes",
  includeTags: true
};
var HeyboxImporterSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("\u9ED8\u8BA4\u6587\u4EF6\u5939").setDesc("\u5BFC\u5165\u7684\u5C0F\u9ED1\u76D2\u5E16\u5B50\u5C06\u4FDD\u5B58\u5230\u6B64\u6587\u4EF6\u5939").addText(
      (text) => text.setPlaceholder("Heybox Notes").setValue(this.plugin.settings.defaultFolder).onChange(async (value) => {
        this.plugin.settings.defaultFolder = value || "Heybox Notes";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u6DFB\u52A0\u6807\u7B7E").setDesc("\u662F\u5426\u5728\u6B63\u6587\u672B\u5C3E\u6DFB\u52A0\u5E16\u5B50\u6807\u7B7E").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.includeTags).onChange(async (value) => {
        this.plugin.settings.includeTags = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

// main.ts
var HeyboxImporterPlugin = class extends import_obsidian2.Plugin {
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("book-open", "Import Heybox post", () => {
      new HeyboxImportModal(this.app, this).open();
    });
    this.addCommand({
      id: "import-heybox-post",
      name: "Import Heybox post",
      callback: () => {
        new HeyboxImportModal(this.app, this).open();
      }
    });
    this.addSettingTab(new HeyboxImporterSettingTab(this.app, this));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    new import_obsidian2.Notice("Settings saved");
  }
};
var HeyboxImportModal = class extends import_obsidian2.Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("heybox-importer-modal");
    contentEl.createEl("h3", { text: "Import Heybox post" });
    contentEl.createEl("p", {
      text: "Paste a Heybox share link",
      cls: "setting-item-description"
    });
    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "https://www.xiaoheihe.cn/community/..."
    });
    const buttonDiv = contentEl.createEl("div", { cls: "setting-item-control" });
    const submitBtn = buttonDiv.createEl("button", { text: "Import" });
    submitBtn.addEventListener("click", async () => {
      const text = input.value.trim();
      if (!text) {
        new import_obsidian2.Notice("Please enter a link");
        return;
      }
      const parsed = parseURL(text);
      if (!parsed) {
        new import_obsidian2.Notice("Unrecognized Heybox link");
        return;
      }
      await this.doImport(parsed.link_id);
    });
  }
  onClose() {
    this.contentEl.empty();
  }
  async doImport(link_id) {
    const notice = new import_obsidian2.Notice("Fetching Heybox data...", 0);
    try {
      const post = await fetchPost(link_id);
      if (!post) {
        notice.hide();
        new import_obsidian2.Notice("Failed to fetch post content");
        return;
      }
      const markdown = buildMarkdown(post, {
        includeTags: this.plugin.settings.includeTags
      });
      const folderPath = this.plugin.settings.defaultFolder;
      if (!await this.app.vault.adapter.exists(folderPath)) {
        await this.app.vault.createFolder(folderPath);
      }
      const filename = sanitizeFilename(post.title) + ".md";
      const filePath = folderPath + "/" + filename;
      let finalPath = filePath;
      let counter = 1;
      while (await this.app.vault.adapter.exists(finalPath)) {
        finalPath = folderPath + "/" + sanitizeFilename(post.title) + "-" + counter + ".md";
        counter++;
      }
      await this.app.vault.create(finalPath, markdown);
      notice.hide();
      new import_obsidian2.Notice("Imported: " + post.title);
      this.close();
    } catch (error) {
      notice.hide();
      const msg = error instanceof Error ? error.message : String(error);
      new import_obsidian2.Notice("Import failed: " + msg);
      console.error("Heybox Importer error:", error);
    }
  }
};
