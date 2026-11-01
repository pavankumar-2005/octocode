import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { Collab } from "../lib/collab";
import { useTheme } from "../lib/theme";

type Props = {
  collab: Collab;
  language: string;
  onReady?: (editor: editor.IStandaloneCodeEditor) => void;
};

export default function CodeEditor({ collab, language, onReady }: Props) {
  const bindingRef = useRef<MonacoBinding>();
  const { theme } = useTheme();
  useEffect(() => () => bindingRef.current?.destroy(), []);

  return (
    <Editor
      height="100%"
      // Our own themes (defined in lib/monaco.ts) so the editor matches the app's light/dark colors.
      theme={theme === "dark" ? "octo-dark" : "octo-light"}
      language={language}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true, // re-measure when the panel resizes, so the editor always fills it
        padding: { top: 16 },
        smoothScrolling: true,
        cursorSmoothCaretAnimation: "on",
        scrollBeyondLastLine: false,
      }}
      onMount={(editor) => {
        // Binds Monaco's text model to the shared Y.Text. Typing → CRDT updates, and back.
        // Passing awareness makes y-monaco draw other users' cursors and selections.
        bindingRef.current = new MonacoBinding(
          collab.ytext,
          editor.getModel()!,
          new Set([editor]),
          collab.provider.awareness
        );
        onReady?.(editor);
      }}
    />
  );
}
