import {MarkdownRenderChild, Plugin} from 'obsidian';
import {CBPPSettingsTab, ConfigStore, DEFAULT_SETTINGS, StoreContext} from "./CBPPSettings";
import {createRoot} from "react-dom/client";
import CodeRunner from "./ui/CodeRunner";
import {CBPPSettings, CodeBlockConfig} from "./types";

export default class CodeBlocksPlusPlus extends Plugin {
	settings!: ConfigStore<CBPPSettings>;

	async onload() {
		await this.loadSettings();


		this.registerMarkdownCodeBlockProcessor('cbpp', (source, el, ctx) => {
			const root = createRoot(el);

			const config: CodeBlockConfig = {
				lang: "",
				theme: undefined,
				numbers: undefined,
				runnable: undefined,
				allowInput: undefined,
			}

			let lines = source.split("\n").filter(l => {
				if(l.startsWith("@")) {
					const [key, value] = l.substring(1, l.length).split("=");
					if(key === "lang" && value) {
						config.lang = value;
					}
					if(key === "theme" && value) {
						config.theme = value;
					}
					if(key === "numbers" && value) {
						config.numbers = value.toLowerCase() === "true" ? true : value.toLowerCase() === "false" ? false: undefined;
					}
					if(key === "runnable" && value) {
						config.runnable = value.toLowerCase() === "true" ? true : value.toLowerCase() === "false" ? false: undefined;
					}
					if(key === "input" && value) {
						config.allowInput = value.toLowerCase() === "true" ? true : value.toLowerCase() === "false" ? false: undefined;
					}
					return false;
				}else {
					return true;
				}
			});

			root.render(
				<StoreContext.Provider value={this.settings}>
					<CodeRunner lines={lines} config={config} />
				</StoreContext.Provider>
			);

			ctx.addChild(
				new (class extends MarkdownRenderChild {
					onunload() {
						root.unmount();
					}
				})(el)
			);
		})
	}
	onunload() {
	}


	async loadSettings() {
		this.settings = new ConfigStore(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
		this.addSettingTab(new CBPPSettingsTab(this.app, this));
	}

	async updateSettings(patch: Partial<CBPPSettings>) {
		const next = { ...this.settings.get(), ...patch };
		this.settings.set(next);          // every mounted block re-renders
		await this.saveData(next);
	}
}
