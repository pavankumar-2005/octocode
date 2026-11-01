import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

// Monaco runs language features in Web Workers. Vite's "?worker" import bundles them for us.
self.MonacoEnvironment = {
  getWorker(_id, label) {
    if (label === "typescript" || label === "javascript") return new tsWorker();
    return new editorWorker();
  },
};

// y-monaco imports "monaco-editor" directly. Make the React <Editor> use that SAME copy
// (instead of downloading its own from a CDN) so the binding and editor share one Monaco.
loader.config({ monaco });
