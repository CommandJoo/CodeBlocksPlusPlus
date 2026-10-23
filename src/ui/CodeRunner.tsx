import {useEffect, useState} from "react";
import type {ChildProcessWithoutNullStreams} from "child_process";
import {spawn} from "child_process";
import HighlightedCode from "./HighlightedCode";
import {CodeBlockConfig, RegisteredLanguage} from "../types";
import {useSettings} from "../CBPPSettings";
import {Play, Square, Copy} from "lucide-react";
import {Notice} from "obsidian";

type CodeRunnerProps = {
	lines: string[];
	config: CodeBlockConfig;
	metadataConfig: Partial<CodeBlockConfig>;
}

export default function CodeRunner({lines, config, metadataConfig}: CodeRunnerProps) {
	const settings = useSettings();
	const [resolvedLanguage] = useState<RegisteredLanguage>(resolveRegisteredLanguage());
	const [process, setProcess] = useState<ChildProcessWithoutNullStreams | null>(null);
	const [outputLines, setOutputLines] = useState<string[]>([]);
	const source = lines.join("\n");

	useEffect(() => {
		if (!process) return;

		const onOut = (data: Uint8Array | string): void => {
			const text = typeof data === "string" ? data : new TextDecoder().decode(data);
			const chunkLines = text
				.split(/\r?\n/)
				.filter((line) => line.length > 0);

			setOutputLines((prev) => [...prev, ...chunkLines]);
		};
		let onClose = (code: number | null): void => {
			setOutputLines((prev: string[]) => [...prev, "Process exited with code " + (code !== null ? code : 0)]);
			setProcess(null);
		}
		process.stdout.setEncoding("utf-8")
		process.stdout.on("data", onOut);
		process.stderr.on("data", onOut);
		process.on("close", onClose);

		return () => {
			process.stdout.off("data", onOut);
			process.stderr.off("data", onOut);
			process.off("close", onClose);
			if (process.exitCode === null && !process.killed) process.kill("SIGTERM");
		};
	}, [process]);

	function resolveRegisteredLanguage(): RegisteredLanguage {
		let lang: RegisteredLanguage = {
			name: "",
			aliases: [],
			executable: "",
			command: "",
			preamble: "",
			deletable: false
		};
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
		if (!resolvedLanguage.executable) return;
		const proc: ChildProcessWithoutNullStreams =
			spawn(
				resolvedLanguage.executable,
				[resolvedLanguage.command, resolvedLanguage.preamble + "\n" + source],
				{shell: false}
			);
		setProcess(proc);
	}

	return <div className={"code-runner"}
				style={{"padding": (config.runnable !== null ? config.runnable : settings.runnable) ? "8px" : "0"}}>
		<HighlightedCode code={source} config={settings.allowInlineMetadata ? {...config, ...metadataConfig} : config}/>
		{(config.runnable !== null ? config.runnable : settings.runnable) &&
			<div className={"output"}>
				{outputLines.length > 0 ? (outputLines.map((l, i) => {
					return <div className={"line"} key={i}>{l}</div>
				})) : <div className={"line"}></div>}
			</div>
		}
		{((config.allowInput !== null ? config.allowInput : settings.allowInput) && (config.runnable !== null ? config.runnable : settings.runnable)) &&
			<input type="text" placeholder={"Input"} onKeyDown={(e) => {
				if (e.key === "Enter") {
					if (!process || process.killed) return;
					process.stdin.write(e.currentTarget.value + "\n");
					e.currentTarget.value = "";
				}
			}}/>
		}
		{((config.runnable !== null ? config.runnable : settings.runnable) && (config.showButtons === null || config.showButtons)) &&
			<div className={"buttons"}>
				<button className={"run " + ((process && !process?.killed) ? "running" : "")} onClick={() => {
					if (config.runnable !== null ? config.runnable : settings.runnable) {
						setOutputLines([]);
						runCode();
					}
				}}><Play className={"run-icon"}/></button>
				<button className={"stop " + ((process && !process?.killed) ? "running" : "")} onClick={() => {
					if (config.runnable !== null ? config.runnable : settings.runnable) {
						if (process) {
							process.kill("SIGTERM");
						}
					}
				}}><Square className={"stop-icon"}/></button>
				<button className={"copy"} onClick={() => {
					void navigator.clipboard.writeText(lines.join("\n"));
					new Notice("Copied!\nSuccessfully copied code to clipboard", 2000);
				}}><Copy className={"copy-icon"}/></button>
			</div>}
	</div>
}
