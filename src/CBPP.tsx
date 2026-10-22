import {MarkdownRenderChild, Plugin} from 'obsidian';
import {CBPPSettingsTab, ConfigStore, DEFAULT_SETTINGS, StoreContext} from "./CBPPSettings";
import {createRoot} from "react-dom/client";
import CodeRunner from "./ui/CodeRunner";
import {CBPPSettings, CodeBlockConfig} from "./types";

const METADATA_PREFIX = "@cbpp:"

export default class CodeBlocksPlusPlus extends Plugin {
	settings!: ConfigStore<CBPPSettings>;

	codeToMetadata(source: string[]): [CodeBlockConfig, string[]] {
		let lines = [];
		const config: CodeBlockConfig = {
			lang: "",
			theme: undefined,
			numbers: undefined,
			runnable: undefined,
			allowInput: undefined,
		}

		let finished = false;
		for(let line of source) {
			if(line.startsWith(METADATA_PREFIX) && !finished) {
				const [key, value] = line.substring(METADATA_PREFIX.length,line.length).split("=");
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
			}else {
				finished = true;
				lines.push(line);
			}
		}
		return [config, lines];
	}

	async onload() {
		await this.loadSettings();


		this.registerMarkdownCodeBlockProcessor('cbpp', (source, el, ctx) => {
			const root = createRoot(el);

			const rawLines = source.split("\n");
			const [config, lines] = this.codeToMetadata(rawLines);

			const sectionInfo = ctx.getSectionInfo(el);
			let sectionLines: string[] = [];
			sectionInfo?.text.split("\n").forEach((line, i) => {
				if(i >= sectionInfo?.lineStart && i <= sectionInfo?.lineEnd) {
					sectionLines.push(line);
				}
			})
			console.log(sectionInfo?.lineStart, sectionInfo?.lineEnd);
			console.log(sectionLines);

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
