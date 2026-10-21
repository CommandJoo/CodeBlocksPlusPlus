import {App, Editor, MarkdownView, PluginSettingTab, Setting, SettingDefinitionItem, WorkspaceLeaf} from 'obsidian';
import {createContext, useContext, useSyncExternalStore} from "react";
import CodeBlocksPlusPlus from "./CBPP";
import {bundledThemes} from "shiki";
import {CBPPSettings, RegisteredLanguage} from "./types";
import {EditorView} from "@codemirror/view";
import {StateEffect} from "@codemirror/state";
import {createRoot, Root} from "react-dom/client";
import {RegisterLanguageModal} from "./ui/RegisterLanguageModal";

export const DEFAULT_SETTINGS: CBPPSettings = {
	shikiTheme: 'github-dark',
	shikiLines: true,
	runnable: true,
	allowInput: true,
	registeredLanguages: [
		{
			name: "javascript",
			aliases: ["js"],
			executable: "node",
			command: "-e",
			preamble: "",
			deletable: false,
		}
	]
};

const themes: Record<string, string> = Object.fromEntries(
	Object.keys(bundledThemes).map((id) => [id, id])
);

export const rerenderEffect = StateEffect.define<void>();

function rerenderBlocks(app: App) {
	app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
		if (leaf.view instanceof MarkdownView) {
			leaf.view.previewMode.rerender(true);
		}
	});
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	const cm = (view?.editor as any)?.cm as EditorView | undefined;
	if (cm) {
		cm.dispatch({effects: rerenderEffect.of()});
	}
}


export class ConfigStore<T> {
	private listeners = new Set<() => void>();

	constructor(private value: T) {
	}

	subscribe = (cb: () => void) => {
		this.listeners.add(cb);
		return () => this.listeners.delete(cb);
	};

	get = () => this.value;

	set(next: T) {
		this.value = next;                     // must be a NEW object so React sees the change
		this.listeners.forEach(cb => cb());
	}
}

export const StoreContext = createContext<ConfigStore<CBPPSettings>>(null!);

export function useSettings() {
	const store = useContext(StoreContext);
	return useSyncExternalStore(store.subscribe, store.get);
}

export class CBPPSettingsTab extends PluginSettingTab {
	plugin: CodeBlocksPlusPlus;

	constructor(app: App, plugin: CodeBlocksPlusPlus) {
		super(app, plugin);
		this.plugin = plugin;
	}

	openAddForm = () => {
		new RegisterLanguageModal(this.app, async (name, aliases, executable, command, preamble, deletable) => {
			const langs = this.plugin.settings.get().registeredLanguages;
			await this.plugin.updateSettings({registeredLanguages: [...langs, {
					name,
					aliases,
					executable,
					command,
					preamble,
					deletable
				}]});
			this.update();
		}).open();
	};

	async updateLanguage(
		originalName: string,
		patch: Partial<RegisteredLanguage>
	) {
		const langs = this.plugin.settings.get().registeredLanguages.map(lang =>
			lang.name === originalName
				? { ...lang, ...patch }
				: lang
		);

		await this.plugin.updateSettings({
			registeredLanguages: langs
		});

		this.update();
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: "group",
				heading: "Shiki Settings",
				items: [
					{
						name: "Shiki Theme",
						desc: "Defines standard theme used to highlight Codeblocks.",
						control: {
							type: "dropdown",
							key: "shikiTheme",
							options: themes,
						}
					},
					{
						name: "Show line numbers",
						control: {
							type: "toggle",
							key: "shikiLines",
						}
					}
				]
			},
			{
				type: "group",
				heading: "Codeblock Default Properties",
				items: [
					{
						name: "Executable codeblocks",
						desc: "Decides if Codeblocks with registered languages can be executed to display their output.",
						control: {
							type: "toggle",
							key: "runnable",
						}
					},
					{
						name: "Allow input",
						desc: "Decides if user input is allowed on the Codeblock.",
						control: {
							type: "toggle",
							key: "allowInput",
							disabled: () => !this.plugin.settings.get().runnable,
						}
					}
				]
			},
			{
				type: "list",
				heading: "Registered Languages",
				items: this.plugin.settings.get().registeredLanguages.map((lang) => ({
					name: lang.name.substring(0, 1).toUpperCase() + lang.name.substring(1, lang.name.length),
					searchable: true,
					render: (setting: Setting) => {
						const container = setting.settingEl;
						container.findAll(".cbpp-language-entry")
							.forEach(el => el.remove());

						const row = container.createDiv({
							cls: "cbpp-language-entry"
						});

						new Setting(row)
							.setName("Name")
							.addText(text => text.setValue(lang.name).then(text => {
								let input = text.inputEl;
								input.addEventListener("blur", (e) => {
									this.updateLanguage(lang.name, {name: input.value});
								})
							}))
						new Setting(row)
							.setName("Aliases")
							.addText(text => text.setValue(lang.aliases.join(", ")).then(text => {
								let input = text.inputEl;
								input.addEventListener("blur", (e) => {
									this.updateLanguage(lang.name, {aliases: input.value.trim().toLowerCase().split(",").map(a => a.trim())});
								})
							}))
						new Setting(row)
							.setName("Executable")
							.addText(text => text.setValue(lang.executable).then(text => {
								let input = text.inputEl;
								input.addEventListener("blur", (e) => {
									this.updateLanguage(lang.name, {executable: input.value});
								})
							}))
							.addText(text => text.setValue(lang.command).then(text => {
								let input = text.inputEl;
								input.addEventListener("blur", (e) => {
									this.updateLanguage(lang.name, {command: input.value});
								})
							}))
						new Setting(row)
							.setName("Preamble")
							.addTextArea(text => text.setValue(lang.preamble).then(text => {
								let input = text.inputEl;
								input.addEventListener("blur", (e) => {
									this.updateLanguage(lang.name, {preamble: input.value});
								})
							}))
						new Setting(row)
							.addButton(button => button.setButtonText("Remove").setCta().onClick(async () => {
								const langs = this.plugin.settings.get().registeredLanguages
									.filter(l => l.name !== lang.name);

								await this.plugin.updateSettings({ registeredLanguages: langs });
								this.update();
							}));
					}
				})),
				addItem: {
					name: 'Add folder',
					action: () => {
						this.openAddForm();
					}
				}
			}
		];
	}

	getControlValue(key: string): unknown {
		return (this.plugin.settings.get() as any)[key];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		await this.plugin.updateSettings({[key]: value});
	}
}
