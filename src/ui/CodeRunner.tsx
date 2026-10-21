import {useEffect, useState} from "react";
import {ChildProcess, spawn} from "node:child_process";
import HighlightedCode from "./HighlightedCode";
import {CodeBlockConfig} from "../types";
import {useSettings} from "../CBPPSettings";

type CodeRunnerProps = {
	lines: string[];
	config: CodeBlockConfig;
}

export default function CodeRunner({lines, config}: CodeRunnerProps) {
	const settings = useSettings();
	const [proccess, setProcess] = useState<ChildProcess>();
	const [outputLines, setOutputLines] = useState<string[]>([]);
	const source = lines.join("\n");

	useEffect(() => {
		if (!proccess) return;

		let onOut = (data: Buffer) => setOutputLines(prev => [...prev, ...data.toString().split(/\r?\n/).filter(line => line.length > 0)]);
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

	return <div className={"code-runner"} style={{"padding": (config.runnable !== undefined ? config.runnable : settings.runnable) ? "8px" : "0"}}>
		<HighlightedCode code={source} config={config}/>
		<button id={"lang"} onClick={() => {
			if(config.runnable !== undefined ? config.runnable : settings.runnable) {
				setOutputLines([]);
				let proc: ChildProcess = spawn("node", ["-e", source]);
				setProcess(proc);
			}
		}}>{config.lang}</button>
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
