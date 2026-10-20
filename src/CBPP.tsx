import {MarkdownRenderChild, Plugin} from 'obsidian';
import {CBPPSettings, CBPPSettingsTab, DEFAULT_SETTINGS} from "./CBPPSettings";
import {createRoot} from "react-dom/client";
import CodeRunner from "./ui/CodeRunner";

export default class CodeBlocksPlusPlus extends Plugin {
	settings!: CBPPSettings;

	async onload() {
		await this.loadSettings();


		this.registerMarkdownCodeBlockProcessor('cbpp', (source, el, ctx) => {
			const root = createRoot(el);

			const config = {
				lang: "",
				shikiTheme: this.settings.shikiTheme,
				runnable: this.settings.runnable,
				allowInput: this.settings.allowInput,
			};

			let lines = source.split("\n").filter(l => {
				if(l.startsWith("@")) {
					const [key, value] = l.substring(1, l.length).split("=");
					if(key === "lang" && value) {
						config.lang = value;
					}
					if(key === "theme" && value) {
						config.shikiTheme = value;
					}
					return false;
				}else {
					return true;
				}
			});

			root.render(<CodeRunner  lines={lines} config={config}/>);

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
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<CBPPSettings>,
		);

		this.addSettingTab(new CBPPSettingsTab(this.app, this));
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
