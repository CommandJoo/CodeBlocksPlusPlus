import {useEffect, useState} from "react";
import {BundledLanguage, codeToTokens, createHighlighter, ThemedToken} from "shiki";
import {CodeBlockConfig} from "../types";
import {useSettings} from "../CBPPSettings";

type HighlightedCodeProps = {
	code: string;
	config: CodeBlockConfig;
}

export default function HighlightedCode({code, config}: HighlightedCodeProps) {
	const settings = useSettings();
	const [tokens, setTokens] = useState<ThemedToken[][]>([]);

	useEffect(() => {
		let cancelled = false;

		async function highlight() {
			const result = await codeToTokens(code, {
				lang: config.lang as BundledLanguage,
				theme: config.theme ? config.theme : settings.shikiTheme,
			});

			if (!cancelled) {
				setTokens(result.tokens);
			}
		}

		void highlight();

		return () => {
			cancelled = true;
		};
	}, [code, config.lang, settings]);

    return <pre id={"cbpp-code"}>
		<code>
			{tokens.map((line,i) => {
				return <span className={"line "+((config.numbers !== undefined ? config.numbers : settings.shikiLines) ? "numbers" : "")} key={i}>
                        {line.map((token, j) => (
							<span
								key={j}
								style={{ color: token.color }}
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
