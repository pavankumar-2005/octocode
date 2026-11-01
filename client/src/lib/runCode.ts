import { runOnServer } from "./api";
import { getLanguage } from "./languages";

export type RunResult = { ok: boolean; output: string };

// Python/JS run in the browser; Java/C++/C are sent to the server's runner container.
export async function runForLanguage(language: string, code: string): Promise<RunResult> {
  if (getLanguage(language).runsIn === "server") {
    try {
      return await runOnServer(language, code);
    } catch (err) {
      return { ok: false, output: `Could not reach the code runner: ${(err as Error).message}` };
    }
  }
  return runCode(language === "javascript" ? "/js-worker.js" : "/python-worker.js", code);
}

export function runCode(
  workerFile: "/python-worker.js" | "/js-worker.js",
  code: string,
  timeoutMs = 10000
): Promise<RunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(workerFile);
    // Killing the worker is how we stop infinite loops.
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, output: "Timed out after 10 s" });
    }, timeoutMs);
    worker.onmessage = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.postMessage({ code });
  });
}
