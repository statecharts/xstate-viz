import React, { useRef, useEffect, useState } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { KeyCode, KeyMod } from "monaco-editor";
import { format } from "prettier/standalone";
import tsParser from "prettier/parser-typescript";
import * as ts from "typescript";
import { hashString } from "./utils";

// TODO: use this to implement undo (CMD + Z) in the editor
const UNDO_TRACKER = 4;
const lscache = {
  __store: new Map(),
  get(key: string) {
    const data = this.__store.get(key);
    return data || null;
  },
  set(key: string, value: string) {
    const keys = Array.from(this.__store.keys());
    while (this.__store.size >= UNDO_TRACKER) {
      // Remove from top (FIFO)
      this.__store.delete(keys[0]);
    }
    this.__store.set(key, value);
  }
};

type Def = { fileName: string; content: string };

type EditorAction = Omit<monaco.editor.IActionDescriptor, "run"> & {
  run: (value: string) => void;
};
type MonacoEditorProps = {
  value: string;
  onChange: (code: string) => void;
  definitions: Def[] | undefined;
  height?: string;
  mode?: string;
  registerEditorActions?: EditorAction[];
};

function prettify(code: string) {
  return format(code, {
    parser: "typescript",
    plugins: [tsParser]
  });
}

export function MonacoEditor(props: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null!);
  /**
   * In case editor is controlled in future, this needs to be changed to `useLayoutEffect`
   * to avoid stale values considering React batches state updates and effect execution
   */
  useEffect(() => {
    const { value, onChange, registerEditorActions = [] } = props;
    const definitions = props.definitions as Def[];

    // Register definition files in the lib registry
    for (const file of definitions) {
      const fakePath = `file:///node_modules/@types/xstate/${file.fileName}`;
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        file.content,
        fakePath
      );
    }

    // Expose required methods from xstate to globals in order to avoid users from using scoped methods.
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
          import * as _XState from "xstate";

          declare global {
            var XState: typeof _XState;
            var Machine: typeof _XState.Machine;
            var assign: typeof _XState.assign;
            var spawn: typeof _XState.spawn;
            var send: typeof _XState.send;
            var sendParent: typeof _XState.sendParent;
            var matchState: typeof _XState.matchState;
          }
        `,
      "file:///global.d.ts"
    );

    // Restore TS source from the cache if it's available
    const modelValue = lscache.get(hashString(value)) || value;

    const model = monaco.editor.createModel(
      modelValue,
      "typescript",
      monaco.Uri.parse("file:///main.tsx")
    );

    const editor = monaco.editor.create(editorRef.current, {
      language: "typescript",
      minimap: { enabled: false },
      lineNumbers: "off",
      scrollBeyondLastLine: false,
      theme: "vs-dark",
      wordWrap: "bounded",
      readOnly: !onChange,
      fontSize: 12,
      fixedOverflowWidgets: true, // in order to show suggestion boxes wider than the editor size
      model
    });

    // Register CTRL+S (CMD + S) to run format action
    editor.addAction({
      id: "run-prettier",
      label: "Run Prettier",
      keybindings: [KeyMod.CtrlCmd | KeyCode.KEY_S],
      run: ed => {
        ed.getAction("editor.action.formatDocument").run();
      }
    });

    // Register custom actins passed to the editor
    registerEditorActions.forEach(action => {
      editor.addAction({
        ...action,
        run: ed => {
          action.run(ts.transpileModule(ed.getValue(), {}).outputText);
        }
      });
    });

    // Register formatting action using Prettier
    monaco.languages.registerDocumentFormattingEditProvider("typescript", {
      provideDocumentFormattingEdits: model => {
        try {
          return [
            {
              text: prettify(editor.getValue()),
              range: model.getFullModelRange()
            }
          ];
        } catch (err) {
          console.warn(err);
        }
      }
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      allowJs: false,
      typeRoots: ["node_modules/@types"],
      target: monaco.languages.typescript.ScriptTarget.ES2016,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true
    });

    // Run format on initial code
    editor.getAction("editor.action.formatDocument").run();

    // Subscribe to editor model content change
    const subscription = editor.onDidChangeModelContent(() => {
      const editorValue = editor.getValue();
      const output = ts.transpileModule(editorValue, {});
      lscache.set(hashString(output.outputText), editorValue);
      props.onChange(output.outputText);
    });

    return () => {
      if (editor) {
        (editor.getModel() as monaco.IDisposable).dispose();
        editor.dispose();
      }
      if (subscription) {
        subscription.dispose();
      }
    };
  }, []);

  return (
    <div
      style={{ height: props.height || "100%", width: "100%" }}
      ref={editorRef}
    />
  );
}

MonacoEditor.KeyCode = KeyCode;
MonacoEditor.KeyMod = KeyMod;
