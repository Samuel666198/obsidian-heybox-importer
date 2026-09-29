import { App, PluginSettingTab, Setting } from "obsidian";
import type HeyboxImporterPlugin from "../main";

export interface HeyboxImporterSettings {
  defaultFolder: string;
  includeTags: boolean;
  hotCommentLimit: number;
}

export const DEFAULT_SETTINGS: HeyboxImporterSettings = {
  defaultFolder: "Heybox Notes",
  includeTags: true,
  hotCommentLimit: 5,
};

export function normalizeHotCommentLimit(value: unknown): number {
  const limit = Number(value);
  return Number.isSafeInteger(limit) && limit > 0 ? limit : DEFAULT_SETTINGS.hotCommentLimit;
}

export class HeyboxImporterSettingTab extends PluginSettingTab {
  plugin: HeyboxImporterPlugin;

  constructor(app: App, plugin: HeyboxImporterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("默认文件夹")
      .setDesc("导入的小黑盒帖子将保存到此文件夹")
      .addText((text) =>
        text
          .setPlaceholder("Heybox Notes")
          .setValue(this.plugin.settings.defaultFolder)
          .onChange(async (value) => {
            this.plugin.settings.defaultFolder = value || "Heybox Notes";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("添加标签")
      .setDesc("是否在正文末尾添加帖子标签")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeTags)
          .onChange(async (value) => {
            this.plugin.settings.includeTags = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("热门评论数量")
      .setDesc("保存点赞最高的评论，默认为 5 条")
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "1";
        text.inputEl.step = "1";
        text
          .setPlaceholder("5")
          .setValue(String(this.plugin.settings.hotCommentLimit))
          .onChange(async (value) => {
            const normalized = normalizeHotCommentLimit(value);
            this.plugin.settings.hotCommentLimit = normalized;
            if (String(normalized) !== value) text.setValue(String(normalized));
            await this.plugin.saveSettings();
          });
      });
  }
}
