import React, { Component, useState, useEffect, useContext } from 'react';
import AceEditor, { AceEditorProps } from 'react-ace';
import 'brace/theme/monokai';
import 'brace/mode/javascript';
import { StyledButton } from './Button';
import styled from 'styled-components';
import { AppContext } from './App';

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
      <AceEditor
        mode={mode}
        theme="monokai"
        editorProps={{ $blockScrolling: true }}
        value={code}
        onChange={value => setCode(value)}
        setOptions={{ tabSize: 2, fontSize: '12px' }}
        width="100%"
        height={height as string}
        showGutter={false}
        readOnly={!onChange}
        wrapEnabled
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
          disabled={isSaving || state.matches({ auth: 'pendingAuthorization' })}
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
            : !state.matches({ auth: 'authorized' }) &&
              !state.matches({ auth: 'unauthorized' })
            ? 'Logging in...'
            : 'Login to save'}
        </StyledButton>
      </StyledButtons>
    </StyledEditor>
  );
};
