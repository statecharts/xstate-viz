import React, {
  Component,
  useState,
  useEffect,
  useContext,
  createContext,
  useRef
} from "react";
import { AceEditorProps } from "react-ace";
import { StyledButton } from "./Button";
import styled from "styled-components";
import { AppContext } from "./App";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { KeyCode, KeyMod } from "monaco-editor";
import { format } from "prettier/standalone";
import tsParser from "prettier/parser-typescript";
import defs from "./xstate-definitions.json";

type Def = { fileName: string; content: string };
const context = createContext<Def[] | undefined>(undefined);

function DefinitionProvider({ children }: { children: React.ReactNode }) {
  return <context.Provider value={defs}>{children}</context.Provider>;
}

interface EditorProps extends AceEditorProps {
  code: string;
  onChange: (code: string) => void;
  onSave: (code: string) => void;
  height?: string;
  changeText?: string;
  mode?: string;
}

export const StyledEditor = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
`;

export const StyledButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 1rem;
`;

export const Editor: React.FunctionComponent<EditorProps> = props => {
  return (
    <DefinitionProvider>
      <EditorRenderer {...props} />
    </DefinitionProvider>
  );
};

export const EditorRenderer: React.FunctionComponent<EditorProps> = props => {
  const definitions = useContext(context);
  const [code, setCode] = useState(props.code);
  const { state } = useContext(AppContext);
  const {
    onChange,
    onSave,
    height = "100%",
    changeText = "Update",
    mode = "javascript"
  } = props;
  const isSaving =
    state.matches({
      auth: { authorized: { gist: "patching" } }
    }) ||
    state.matches({
      auth: { authorized: { gist: "posting" } }
    });

  return (
    <StyledEditor>
      <MonacoEditor
        onChange={value => setCode(value)}
        value={code}
        definitions={definitions}
        mode={mode}
        height={height}
      />
      <StyledButtons>
        <StyledButton
          data-variant="secondary"
          disabled={isSaving}
          onClick={() => onChange(code)}
        >
          {changeText}
        </StyledButton>
        <StyledButton
          data-variant="primary"
          disabled={isSaving}
          onClick={() => {
            onChange(code);
            onSave(code);
          }}
        >
          {state.matches({
            auth: { authorized: { gist: "patching" } }
          })
            ? "Saving..."
            : state.matches({
                auth: { authorized: { gist: "posting" } }
              })
            ? "Uploading..."
            : state.matches({
                auth: { authorized: { gist: { idle: "patched" } } }
              })
            ? "Saved!"
            : state.matches({
                auth: { authorized: { gist: { idle: "posted" } } }
              })
            ? "Uploaded!"
            : state.matches({ auth: "authorized" })
            ? "Save"
            : "Sign in to Save"}
        </StyledButton>
      </StyledButtons>
    </StyledEditor>
  );
};

type MonacoEditorProps = {
  value: string;
  onChange: (code: string) => void;
  definitions: Def[] | undefined;
  height?: string;
  mode?: string;
};

function prettify(code: string) {
  return format(code, {
    parser: "typescript",
    plugins: [tsParser]
  });
}

function MonacoEditor(props: MonacoEditorProps) {
  let subscription: monaco.IDisposable;
  const editorRef = useRef<HTMLDivElement>(null!);
  let editor: monaco.editor.IStandaloneCodeEditor;

  /**
   * In case editor is controlled in future, this needs to be changed to `useLayoutEffect`
   * to avoid stale values considering React batches state updates and effect execution
   */
  useEffect(() => {
    console.log("running effect");
    const { value, onChange, mode = "javascript" } = props;
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

    // Register formatting action using Prettier
    monaco.languages.registerDocumentFormattingEditProvider("javascript", {
      provideDocumentFormattingEdits: model => {
        try {
          console.log("trying to format");
          console.log("formatted code");
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
      console.log("cleanup");

      if (editor) {
        console.log("cleaning editor");
        (editor.getModel() as monaco.IDisposable).dispose();
        editor.dispose();
      }
      if (subscription) {
        console.log("cleaning subscription");
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
