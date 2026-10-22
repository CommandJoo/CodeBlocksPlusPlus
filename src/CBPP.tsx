import {MarkdownRenderChild, MarkdownSectionInformation, Plugin} from 'obsidian';
import {CBPPSettingsTab, ConfigStore, DEFAULT_SETTINGS, StoreContext} from "./CBPPSettings";
import {createRoot} from "react-dom/client";
import CodeRunner from "./ui/CodeRunner";
import {CBPPSettings, CodeBlockConfig} from "./types";

const METADATA_PREFIX = "@cbpp:"

export default class CodeBlocksPlusPlus extends Plugin {
	settings!: ConfigStore<CBPPSettings>;

	sectionInfoToText(info: MarkdownSectionInformation): string[] {
		let lines: string[] = [];
		info?.text.split("\n").forEach((line, i) => {
			if(i >= info.lineStart && i <= info.lineEnd) {
				lines.push(line);
			}
		})
		return lines;
	}

	inlineToMetadata(info: MarkdownSectionInformation): Partial<CodeBlockConfig> {
		let lines = this.sectionInfoToText(info);
		const CODEBLOCK_PREFIX = "```cbpp";
		if(!lines[0]) return {};
		let inline = lines[0].substring(CODEBLOCK_PREFIX.length).trim().split(" ");
		if(inline[0]) {
			return {
				lang: inline[0],
			};
		}else {
			return {};
		}
	}

	codeToMetadata(source: string[]): [CodeBlockConfig, string[]] {
		let lines = [];
		const config: CodeBlockConfig = {
			lang: "",
			theme: null,
			numbers: null,
			runnable: null,
			allowInput: null,
			showButtons: null,
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
					config.numbers = value.toLowerCase() === "true" ? true : value.toLowerCase() === "false" ? false: null;
				}
				if(key === "runnable" && value) {
					config.runnable = value.toLowerCase() === "true" ? true : value.toLowerCase() === "false" ? false: null;
				}
				if(key === "input" && value) {
					config.allowInput = value.toLowerCase() === "true" ? true : value.toLowerCase() === "false" ? false: null;
				}
				if(key === "buttons" && value) {
					config.showButtons = value.toLowerCase() === "true" ? true : value.toLowerCase() === "false" ? false : null;
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
			const info = ctx.getSectionInfo(el)
			const metaConfig: Partial<CodeBlockConfig> = info ? this.inlineToMetadata(info) : {};

			root.render(
				<StoreContext.Provider value={this.settings}>
					<CodeRunner lines={lines} config={config} metadataConfig={metaConfig}/>
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

	loadData(): Promise<CBPPSettings> {
		return super.loadData();
	}


	async loadSettings() {
		this.settings = new ConfigStore<CBPPSettings>(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
		this.addSettingTab(new CBPPSettingsTab(this.app, this));
	}

	async updateSettings(patch: Partial<CBPPSettings>){
		const next = { ...this.settings.get(), ...patch };
		this.settings.set(next);
		await this.saveData(next);
	}
}
