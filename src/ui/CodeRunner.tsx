import {useEffect, useState} from "react";
import type {ChildProcessWithoutNullStreams} from "node:child_process";
import {spawn} from "node:child_process";
import HighlightedCode from "./HighlightedCode";
import {CodeBlockConfig, RegisteredLanguage} from "../types";
import {Buffer} from "node:buffer";
import {useSettings} from "../CBPPSettings";

type CodeRunnerProps = {
	lines: string[];
	config: CodeBlockConfig;
	metadataConfig: Partial<CodeBlockConfig>;
}

export default function CodeRunner({lines, config, metadataConfig}: CodeRunnerProps) {
	const settings = useSettings();
	const [resolvedLanguage] = useState<RegisteredLanguage|undefined>(resolveRegisteredLanguage());
	const [process, setProcess] = useState<ChildProcessWithoutNullStreams|undefined>(undefined);
	const [outputLines, setOutputLines] = useState<string[]>([]);
	const source = lines.join("\n");

	useEffect(() => {
		if (!process) return;

		let onOut = (data: Buffer): void => setOutputLines((prev: string[]) => [...prev, ...data.toString().split(/\r?\n/).filter(line => line.length > 0)]);
		let onClose = (code: number | null): void => setOutputLines((prev: string[]) => [...prev, "Process exited with code " + code]);

		process.stdout?.on("data", onOut);
		process.stderr?.on("data", onOut);
		process.on("close", onClose);

		return () => {
			process.stdout?.off("data", onOut);
			process.stderr?.off("data", onOut);
			process.off("close", onClose);
			if (process.exitCode === null && !process.killed) process.kill("SIGTERM");
		};
	}, [process]);

	function resolveRegisteredLanguage(): RegisteredLanguage | undefined {
		let lang: undefined | RegisteredLanguage = undefined;
		let conf = settings.allowInlineMetadata ? {...config, ...metadataConfig} : config;
		for (let language of settings.registeredLanguages) {
			if (language.name === conf.lang.trim()) {
				lang = language;
				break;
			} else {
				if (language.aliases.find(l => l === conf.lang.trim())) {
					lang = language;
					break;
				}
			}
		}
		return lang;
	}

	function runCode() {
		if (!resolvedLanguage) return;
		if(!resolvedLanguage.executable) return;
		const proc: ChildProcessWithoutNullStreams = spawn(resolvedLanguage.executable, [resolvedLanguage.command, resolvedLanguage.preamble+"\n"+source]);
		setProcess(proc);
	}


	return <div className={"code-runner"}
	            style={{"padding": (config.runnable !== undefined ? config.runnable : settings.runnable) ? "8px" : "0"}}>
		<HighlightedCode code={source} config={settings.allowInlineMetadata ? {...config, ...metadataConfig} : config}/>
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
					process?.stdin?.write(Buffer.from(e.currentTarget.value, "utf-8"));
					e.currentTarget.value = "";
				}
			}}/>
		}
	</div>
}
