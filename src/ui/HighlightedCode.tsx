import {useEffect, useState} from "react";
import {BundledLanguage, codeToTokens, createHighlighter, ThemedToken} from "shiki";

type HighlightedCodeProps = {
	code: string;
	language: string;
	theme: string;
}

export default function HighlightedCode({code, language, theme}: HighlightedCodeProps) {
	const [tokens, setTokens] = useState<ThemedToken[][]>([]);

	useEffect(() => {
		let cancelled = false;

		async function highlight() {
			const result = await codeToTokens(code, {
				lang: language as BundledLanguage,
				theme
			});

			if (!cancelled) {
				setTokens(result.tokens);
			}
		}

		void highlight();

		return () => {
			cancelled = true;
		};
	}, [code, language]);

    return <pre id={"cbpp-code"}>
		<code>
			{tokens.map((line,i) => {
				return <span className="line" key={i}>
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
