import { App, PluginSettingTab, Setting } from "obsidian";
import type HeyboxImporterPlugin from "../main";

export interface HeyboxImporterSettings {
  defaultFolder: string;
  includeTags: boolean;
}

export const DEFAULT_SETTINGS: HeyboxImporterSettings = {
  defaultFolder: "Heybox Notes",
  includeTags: true,
};

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
  }
}
