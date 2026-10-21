import {useEffect, useState} from "react";
import {ChildProcess, spawn} from "node:child_process";
import HighlightedCode from "./HighlightedCode";
import {CodeBlockConfig, RegisteredLanguage} from "../types";
import {useSettings} from "../CBPPSettings";

type CodeRunnerProps = {
	lines: string[];
	config: CodeBlockConfig;
}

export default function CodeRunner({lines, config}: CodeRunnerProps) {
	const settings = useSettings();
	const [resolvedLanguage, setResolvedLanguage] = useState(resolveRegisteredLanguage());
	const [proccess, setProcess] = useState<ChildProcess>();
	const [outputLines, setOutputLines] = useState<string[]>([]);
	const source = lines.join("\n");

	useEffect(() => {
		if (!proccess) return;

		let onOut = (data: Buffer) => {
			console.log(data);
			setOutputLines(prev => [...prev, ...data.toString().split(/\r?\n/).filter(line => line.length > 0)]);
		}
		let onClose = (code: number | null) => setOutputLines(prev => [...prev, "Process exited with code " + code]);

		proccess.stdout?.on("data", onOut);
		proccess.stderr?.on("data", onOut);
		proccess.on("close", onClose);

		return () => {
			proccess.stdout?.off("data", onOut);
			proccess.stderr?.off("data", onOut);
			proccess.off("close", onClose);
			if (proccess.exitCode === null && !proccess.killed) proccess.kill("SIGTERM");
		};
	}, [proccess]);

	useEffect(() => {
		if (!proccess) return;

		return () => {
			if (proccess.exitCode === null && !proccess.killed) {
				proccess.kill("SIGTERM");
			}
		};
	}, [proccess]);

	function resolveRegisteredLanguage(): RegisteredLanguage | undefined {
		let lang: undefined | RegisteredLanguage = undefined;
		for (let language of settings.registeredLanguages) {
			if (language.name === config.lang.trim()) {
				lang = language;
				break;
			} else {
				if (language.aliases.find(l => l === config.lang.trim())) {
					lang = language;
					break;
				}
			}
		}
		return lang;
	}

	function runCode() {
		if (!resolvedLanguage) return;
		let proc: ChildProcess = spawn(resolvedLanguage.executable, [resolvedLanguage.command, resolvedLanguage.preamble+"\n"+source]);
		setProcess(proc);
	}


	return <div className={"code-runner"}
	            style={{"padding": (config.runnable !== undefined ? config.runnable : settings.runnable) ? "8px" : "0"}}>
		<HighlightedCode code={source} config={config}/>
		<button id={"lang"} onClick={() => {
			if (config.runnable !== undefined ? config.runnable : settings.runnable) {
				setOutputLines([]);
				runCode();
			}
		}}>{resolvedLanguage ? resolvedLanguage.name : ""}</button>
		{(config.runnable !== undefined ? config.runnable : settings.runnable) &&
			<div id={"output"}>
				{outputLines.map((l, i) => {
					return <div className={"line"} key={i}>{i} {l}</div>
				})}
			</div>
		}
		{(config.allowInput !== undefined ? config.allowInput : settings.allowInput && (config.runnable !== undefined ? config.runnable : settings.runnable)) &&
			<input type="text" placeholder={"Input"} onKeyDown={(e) => {
				if (e.key === "Enter") {
					proccess?.stdin?.write(Buffer.from(e.currentTarget.value, "utf-8"));
					e.currentTarget.value = "";
				}
			}}/>
		}
	</div>
}
