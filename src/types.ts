import {AbstractInputSuggest} from "obsidian";
import {bundledLanguages} from "shiki";

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
	theme: string | undefined;
	numbers: boolean | undefined;
	runnable: boolean | undefined;
	allowInput: boolean | undefined;
};
const languages = Object.entries(bundledLanguages).map(([id]) => (id))

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
