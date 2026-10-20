import {useEffect, useState} from "react";
import {ChildProcess, spawn} from "node:child_process";
import HighlightedCode from "./HighlightedCode";
import {CBPPSettings} from "../CBPPSettings";

type CodeRunnerProps = {
	lines: string[];
	config: { lang: string } & CBPPSettings;
}

export default function CodeRunner({lines, config}: CodeRunnerProps) {
	const [proccess, setProcess] = useState<ChildProcess>();
	const [outputLines, setOutputLines] = useState<string[]>([]);
	const source = lines.join("\n");

	useEffect(() => {
		if (!proccess) return;

		proccess.stdout?.on("data", (data: Buffer) => {
			setOutputLines(prev => [...prev, ...data.toString().split(/\r?\n/).filter(line => line.length > 0)])
		});

		proccess.stderr?.on("data", (data: Buffer) => {
			let clines = data.toString().split("\n");
			setOutputLines(prev => [...prev, ...data.toString().split(/\r?\n/).filter(line => line.length > 0)])
		});

		proccess.on("close", (code) => {
			setOutputLines(prev => [...prev, "Process exited with code " + code]);
		});

	}, [proccess]);

	useEffect(() => {
		if (!proccess) return;

		return () => {
			if (proccess.exitCode === null && !proccess.killed) {
				proccess.kill("SIGTERM");
			}
		};
	}, [proccess]);

	return <div className={"code-runner"}>
		<HighlightedCode code={source} language={config.lang} theme={config.shikiTheme} numbers={config.shikiLines}/>
		<button id={"lang"} onClick={() => {
			if(config.runnable) {
				setOutputLines([]);
				let proc: ChildProcess = spawn("node", ["-e", source]);
				setProcess(proc);
			}
		}}>{config.lang}</button>
		{config.runnable &&
			<div id={"output"}>
				{outputLines.map((l, i) => {
					return <div className={"line"} key={i}>{i} {l}</div>
				})}
			</div>
		}
		{config.allowInput &&
			<input type="text" placeholder={"Input"} onKeyDown={(e) => {
				if (e.key === "Enter") {
					proccess?.stdin?.write(Buffer.from(e.currentTarget.value, "utf-8"));
					e.currentTarget.value = "";
				}
			}}/>
		}
	</div>
}
