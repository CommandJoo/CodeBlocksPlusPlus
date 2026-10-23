import {AbstractInputSuggest} from "obsidian";
import {bundledLanguagesInfo} from "shiki";

export type RegisteredLanguage = {
	deletable: boolean;
	name: string;
	aliases: string[];
	executable: string;
	command: string;
	preamble: string;
}

export type CBPPSettings = {
	shikiTheme: string;
	shikiLines: boolean
	runnable: boolean;
	allowInput: boolean;
	allowInlineMetadata: boolean;
	registeredLanguages: RegisteredLanguage[];
};

export type CodeBlockConfig = {
	lang: string;
	theme: string | null;
	numbers: boolean | null;
	runnable: boolean | null;
	allowInput: boolean | null;
	showButtons: boolean | null;
};
const languages = Object.entries(bundledLanguagesInfo).map(([_, info]) => (info.id))

export class LanguageSuggest extends AbstractInputSuggest<string> {
	protected getSuggestions(query: string): string[] | Promise<string[]> {
		return languages.filter(l =>
			l.toLowerCase().includes(query.toLowerCase())
		);
	}

	selectSuggestion(value: string) {
		this.setValue(value);
		this.close();
	}

	renderSuggestion(value: string, el: HTMLElement) {
		el.setText(value);
	}
}
