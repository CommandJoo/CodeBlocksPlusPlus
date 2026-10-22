import React, {useEffect, useState} from "react";
import {
	BundledLanguage,
	codeToTokens,
	type ThemedToken
} from "shiki";
import {CodeBlockConfig} from "../types";
import {useSettings} from "../CBPPSettings";

type HighlightedCodeProps = {
	code: string;
	config: CodeBlockConfig;
	children: React.ReactNode;
}


export default function HighlightedCode({code, config, children}: HighlightedCodeProps) {
	const settings = useSettings();
	const [tokens, setTokens] = useState<ThemedToken[][]>([]);

	useEffect(() => {
		let cancelled = false;

		async function highlight() {
			try {
				const theme = config.theme || settings.shikiTheme;

				const result = await codeToTokens(code, {
					lang: config.lang as BundledLanguage,
					theme,
				});

				if (!cancelled) {
					setTokens(result.tokens);
				}
			} catch (error) {
				console.error("CodeBlocks++ highlighting failed:", error);
			}
		}

		void highlight();

		return () => {
			cancelled = true;
		};
	}, [code, config.lang, settings]);

	return <pre id={"cbpp-code"}>
		<code>
			{children}
			{tokens.map((line, i) => {
				return <span
					className={"line " + ((config.numbers !== null ? config.numbers : settings.shikiLines) ? "numbers" : "")} key={i}>
					{line.map((token, j) => (
						<span
							key={j}
							style={{color: token.color}}
						>
                                {token.content}
                            </span>
					))}
					{"\n"}
				</span>;
			})}
		</code>
	</pre>
}
