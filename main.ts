import { Plugin, Notice, Modal, App, Setting } from "obsidian";
import { parseURL } from "./src/parser";
import { fetchPost } from "./src/fetcher";
import { buildMarkdown, sanitizeFilename } from "./src/markdown";
import {
  HeyboxImporterSettingTab,
  HeyboxImporterSettings,
  DEFAULT_SETTINGS,
} from "./src/settings";

export default class HeyboxImporterPlugin extends Plugin {
  settings: HeyboxImporterSettings;

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
      },
    });

    this.addSettingTab(new HeyboxImporterSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    new Notice("Settings saved");
  }
}

class HeyboxImportModal extends Modal {
  plugin: HeyboxImporterPlugin;

  constructor(app: App, plugin: HeyboxImporterPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("heybox-importer-modal");
    contentEl.createEl("h3", { text: "Import Heybox post" });
    contentEl.createEl("p", {
      text: "Paste a Heybox share link",
      cls: "setting-item-description",
    });

    const input = contentEl.createEl("input", {
      type: "text",
      placeholder: "https://www.xiaoheihe.cn/community/...",
    });

    const buttonDiv = contentEl.createEl("div", { cls: "setting-item-control" });
    const submitBtn = buttonDiv.createEl("button", { text: "Import" });
    submitBtn.addEventListener("click", async () => {
      const text = input.value.trim();
      if (!text) {
        new Notice("Please enter a link");
        return;
      }
      const parsed = parseURL(text);
      if (!parsed) {
        new Notice("Unrecognized Heybox link");
        return;
      }
      await this.doImport(parsed.link_id);
    });
  }

  onClose() {
    this.contentEl.empty();
  }

  async doImport(link_id: string) {
    const notice = new Notice("Fetching Heybox data...", 0);
    try {
      const post = await fetchPost(link_id);

      if (!post) {
        notice.hide();
        new Notice("Failed to fetch post content");
        return;
      }

      const markdown = buildMarkdown(post, {
        includeTags: this.plugin.settings.includeTags,
      });

      const folderPath = this.plugin.settings.defaultFolder;
      if (!(await this.app.vault.adapter.exists(folderPath))) {
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
      new Notice("Imported: " + post.title);
      this.close();
    } catch (error) {
      notice.hide();
      const msg = error instanceof Error ? error.message : String(error);
      new Notice("Import failed: " + msg);
      console.error("Heybox Importer error:", error);
    }
  }
}
