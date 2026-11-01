import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import type { Collab } from "../lib/collab";

type Props = {
  collab: Collab;
  language: string;
  onReady?: (editor: editor.IStandaloneCodeEditor) => void;
};

export default function CodeEditor({ collab, language, onReady }: Props) {
  const bindingRef = useRef<MonacoBinding>();
  useEffect(() => () => bindingRef.current?.destroy(), []);

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={language}
      options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, padding: { top: 16 } }}
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
