import {App, PluginSettingTab, Setting} from 'obsidian';
import CodeBlocksPlusPlus from "./CBPP";
import {bundledThemes} from "shiki";

export interface CBPPSettings {
	shikiTheme: string;
	shikiLines: boolean
	runnable: boolean;
	allowInput: boolean;
}

export const DEFAULT_SETTINGS: CBPPSettings = {
	shikiTheme: 'github-dark',
	shikiLines: true,
	runnable: true,
	allowInput: true,
};

const themes: Record<string, string> = Object.fromEntries(
	Object.keys(bundledThemes).map((id) => [id, id])
);

export class CBPPSettingsTab extends PluginSettingTab {
	plugin: CodeBlocksPlusPlus;

	constructor(app: App, plugin: CodeBlocksPlusPlus) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName("Shiki settings").setHeading();
		new Setting(containerEl)
			.setName('Shiki Theme')
			.setDesc("Defines standard theme used to highlight Codeblocks.")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(themes)
					.setValue(this.plugin.settings.shikiTheme)
					.onChange(async (value) => {
						this.plugin.settings.shikiTheme = value;
						await this.plugin.saveSettings();
					})
			);
		new Setting(containerEl)
			.setName('Show line Numbers')
			.addToggle(toggle => toggle.setValue(this.plugin.settings.shikiLines).onChange(async (value) => {
				this.plugin.settings.shikiLines = value;
				await this.plugin.saveSettings();
			}))

		new Setting(containerEl).setName("Codeblock default Properties").setHeading();
		new Setting(containerEl)
			.setName("Executable Code")
			.setDesc("Make Codeblocks with registered languages executable and show their output.")
			.addToggle((toggle) => {
				return toggle.setValue(this.plugin.settings.runnable).onChange(async (value) => {
					this.plugin.settings.runnable = value;
					await this.plugin.saveSettings();
					this.display();
				});
			});
		new Setting(containerEl)
			.setName("Allow Input")
			.setDesc("Allows the user to input their own data into the running codeblock.")
			.addToggle((toggle) => {
				return toggle.setDisabled(!this.plugin.settings.runnable).setValue(this.plugin.settings.runnable && this.plugin.settings.allowInput).onChange(async (value) => {
					this.plugin.settings.allowInput = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
