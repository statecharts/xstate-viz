import React, { useRef, useEffect } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { KeyCode, KeyMod } from "monaco-editor";
import { format } from "prettier/standalone";
import tsParser from "prettier/parser-typescript";

type Def = { fileName: string; content: string };

type MonacoEditorProps = {
  value: string;
  onChange: (code: string) => void;
  definitions: Def[] | undefined;
  height?: string;
  mode?: string;
  registerEditorActions?: monaco.editor.IActionDescriptor[];
};

function prettify(code: string) {
  return format(code, {
    parser: "typescript",
    plugins: [tsParser]
  });
}

export function MonacoEditor(props: MonacoEditorProps) {
  let subscription: monaco.IDisposable;
  const editorRef = useRef<HTMLDivElement>(null!);
  let editor: monaco.editor.IStandaloneCodeEditor;

  /**
   * In case editor is controlled in future, this needs to be changed to `useLayoutEffect`
   * to avoid stale values considering React batches state updates and effect execution
   */
  useEffect(() => {
    const {
      value,
      onChange,
      mode = "javascript",
      registerEditorActions = []
    } = props;
    const definitions = props.definitions as Def[];

    // Register definition files in the lib registry
    for (const file of definitions) {
      const fakePath = `file:///node_modules/@types/xstate/${file.fileName}`;
      monaco.languages.typescript.javascriptDefaults.addExtraLib(
        file.content,
        fakePath
      );
    }

    // Expose required methods from xstate to globals in order to avoid users from using scoped methods.
    monaco.languages.typescript.javascriptDefaults.addExtraLib(
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

    const model = monaco.editor.createModel(
      value,
      mode,
      monaco.Uri.parse("file:///main.tsx")
    );

    editor = monaco.editor.create(editorRef.current, {
      language: mode,
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
      editor.addAction(action);
    });

    // Register formatting action using Prettier
    monaco.languages.registerDocumentFormattingEditProvider("javascript", {
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
      allowJs: true,
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
    subscription = editor.onDidChangeModelContent(() => {
      props.onChange(editor.getValue());
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
