import {App, Modal, Setting} from "obsidian";
import {createRoot} from "react-dom/client";
import {subtle} from "node:crypto";
import {LanguageSuggest} from "../types";

export class RegisterLanguageModal extends Modal {
	constructor(app: App, onSubmit: (name: string, aliases: string[], executable: string, command: string, preamble: string, deletable: boolean) => void) {
		super(app);
		let name = '';
		let aliases: string[] = [];
		let executable = '';
		let command = '';
		let preamble = '';
		const deletable = true;

		this.setTitle("Register a Language");
		new Setting(this.contentEl)
			.setName("Language name")
			.setDesc("The main identifier to be used by custom Codeblocks")
			.addSearch(text => {
					text
						.setPlaceholder("Language")

						.onChange((line) => {
							name = line.toLowerCase().trim();
						});
					new LanguageSuggest(this.app, text.inputEl);
				}
			);
		new Setting(this.contentEl)
			.setName("Aliases")
			.setDesc("Aliases for the language, seperated by comma")
			.addText(text => text
				.setPlaceholder("alias1, alias2, ...")
				.onChange((line) => {
					aliases = line.trim().toLowerCase().split(",").map((a) => a.trim());
				})
			);
		new Setting(this.contentEl)
			.setName("Executable")
			.setDesc("The path to the executable of the interpreter")
			.addText(text => text
				.setPlaceholder("/path/to/executable")
				.onChange((line) => {
					executable = line.toLowerCase().trim();
				})
			)
			.addText(text => text
				.setPlaceholder("-...")
				.onChange((line) => {
					command = line.toLowerCase().trim();
				}));
		new Setting(this.contentEl)
			.setName("Preamble")
			.setDesc("Code that always runs before everything else in this language")
			.addTextArea(text => text
				.setPlaceholder("Custom Code")
				.onChange((line) => {
					command = line.toLowerCase().trim();
				})
			);
		new Setting(this.contentEl)
			.addButton(button => button
				.setCta()
				.setButtonText("Register")
				.onClick(() => {
					this.close();
					onSubmit(name, aliases, executable, command, preamble, deletable);
				}))
	}
}
