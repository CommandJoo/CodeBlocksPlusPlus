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
	registeredLanguages: RegisteredLanguage[];
};

export type CodeBlockConfig = {
	lang: string;
	theme: string|undefined;
	numbers: boolean|undefined;
	runnable: boolean|undefined;
	allowInput: boolean|undefined;
};
