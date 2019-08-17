import React, { useState, useContext } from 'react';
import { StyledButton } from './Button';
import styled from 'styled-components';
import { AppContext } from './App';
import defs from './xstate-definitions.json';
import { MonacoEditor } from './MonacoEditor';

interface EditorProps {
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
  return <EditorRenderer {...props} />;
};

export const EditorRenderer: React.FunctionComponent<EditorProps> = props => {
  const definitions = defs;
  const [code, setCode] = useState(props.code);
  const { state } = useContext(AppContext);
  const {
    onChange,
    onSave,
    height = '100%',
    changeText = 'Update',
    mode = 'javascript'
  } = props;
  const isSaving =
    state.matches({
      auth: { authorized: { gist: 'patching' } }
    }) ||
    state.matches({
      auth: { authorized: { gist: 'posting' } }
    });

  return (
    <StyledEditor>
      <MonacoEditor
        onChange={value => setCode(value)}
        value={code}
        definitions={definitions}
        mode={mode}
        height={height}
        registerEditorActions={[
          // Register CTRL+R (CMD + R) to update the visualizer
          {
            id: 'update-viz',
            label: 'Update Visualizer',
            keybindings: [
              MonacoEditor.KeyMod.CtrlCmd | MonacoEditor.KeyCode.KEY_R
            ],
            run: ed => {
              console.log('update viz');
              if (typeof onSave === 'function') {
                onChange(ed.getValue());
              }
            }
          }
        ]}
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
            auth: { authorized: { gist: 'patching' } }
          })
            ? 'Saving...'
            : state.matches({
                auth: { authorized: { gist: 'posting' } }
              })
            ? 'Uploading...'
            : state.matches({
                auth: { authorized: { gist: { idle: 'patched' } } }
              })
            ? 'Saved!'
            : state.matches({
                auth: { authorized: { gist: { idle: 'posted' } } }
              })
            ? 'Uploaded!'
            : state.matches({ auth: 'authorized' })
            ? 'Save'
            : 'Sign in to Save'}
        </StyledButton>
      </StyledButtons>
    </StyledEditor>
  );
};
