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

// Editor color themes that match the app's light and dark backgrounds (picked in CodeEditor.tsx).
monaco.editor.defineTheme("octo-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#12121c",
    "editor.lineHighlightBackground": "#ffffff08",
    "editorLineNumber.foreground": "#4b4b66",
    "editorLineNumber.activeForeground": "#a78bfa",
    "editorCursor.foreground": "#a78bfa",
    "editor.selectionBackground": "#8b5cf640",
  },
});
monaco.editor.defineTheme("octo-light", {
  base: "vs",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#ffffff",
    "editor.lineHighlightBackground": "#7c3aed0a",
    "editorLineNumber.foreground": "#a1a1aa",
    "editorLineNumber.activeForeground": "#7c3aed",
    "editorCursor.foreground": "#7c3aed",
    "editor.selectionBackground": "#7c3aed30",
  },
});
