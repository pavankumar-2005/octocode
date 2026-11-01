import { spawn } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

const COMPILE_TIMEOUT_MS = 15000; // javac is slow to start, so compiling gets a bit longer
const RUN_TIMEOUT_MS = 10000; // same 10 s limit as the in-browser runners
const MAX_OUTPUT = 64 * 1024; // stop programs that print forever

// How to compile and run each language. Every run gets its own temp folder.
const LANGUAGES = {
  c: () => ({
    file: "main.c",
    compile: ["gcc", "-O2", "-o", "main", "main.c", "-lm"],
    run: ["./main"],
  }),
  cpp: () => ({
    file: "main.cpp",
    compile: ["g++", "-O2", "-std=c++17", "-o", "main", "main.cpp"],
    run: ["./main"],
  }),
  java: (code) => {
    // Java requires the file name to match the public class (usually Main).
    const cls = code.match(/public\s+class\s+(\w+)/)?.[1] ?? "Main";
    return {
      file: `${cls}.java`,
      // SerialGC = fewer JVM threads, which matters under the container's process limit.
      compile: ["javac", "-J-XX:+UseSerialGC", `${cls}.java`],
      run: ["java", "-Xmx256m", "-XX:+UseSerialGC", cls],
    };
  },
};

export const isSupported = (language) => Object.hasOwn(LANGUAGES, language);

function exec([cmd, ...args], cwd, timeoutMs) {
  return new Promise((resolve) => {
    // detached = own process group, so on timeout we kill the program AND anything it started.
    const child = spawn(cmd, args, { cwd, detached: true, env: { PATH: process.env.PATH, TMPDIR: "/tmp" } });
    let output = "";
    let timedOut = false;
    let truncated = false;
    const kill = () => {
      try {
        process.kill(-child.pid, "SIGKILL"); // negative pid = the whole process group
      } catch {}
    };
    const collect = (chunk) => {
      if (output.length < MAX_OUTPUT) output += chunk;
      else if (!truncated) {
        truncated = true;
        kill();
      }
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.stdin.end(); // no input: programs that read stdin get end-of-file instead of hanging
    const timer = setTimeout(() => {
      timedOut = true;
      kill();
    }, timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: -1, output: String(err), timedOut, truncated });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, output, timedOut, truncated });
    });
  });
}

function describe(result, seconds) {
  let output = result.output;
  if (result.truncated) output += "\n[output truncated at 64 KB]";
  if (result.timedOut) return { ok: false, output: output + `\nTimed out after ${seconds} s` };
  if (result.code !== 0) return { ok: false, output: output + `\n[exited with code ${result.code}]` };
  return { ok: true, output };
}

export async function run(language, code) {
  const spec = LANGUAGES[language](code);
  const dir = await mkdtemp(path.join(tmpdir(), "run-"));
  try {
    await writeFile(path.join(dir, spec.file), code);
    const compiled = await exec(spec.compile, dir, COMPILE_TIMEOUT_MS);
    if (compiled.code !== 0 || compiled.timedOut) {
      const { output } = describe(compiled, COMPILE_TIMEOUT_MS / 1000);
      return { ok: false, output: "Compilation failed:\n" + output };
    }
    return describe(await exec(spec.run, dir, RUN_TIMEOUT_MS), RUN_TIMEOUT_MS / 1000);
  } finally {
    await rm(dir, { recursive: true, force: true }); // clean up source and binaries
  }
}
