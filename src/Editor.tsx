import React, { Component } from 'react';
import AceEditor, { AceEditorProps } from 'react-ace';
import 'brace/theme/monokai';
import 'brace/mode/javascript';
import { StyledButton } from './Button';
import styled from 'styled-components';

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

export class Editor extends Component<EditorProps> {
  state = {
    code: this.props.code
  };
  render() {
    const { code } = this.state;
    const {
      onChange,
      onSave,
      height = '100%',
      changeText = 'Update',
      mode = 'javascript'
    } = this.props;

    return (
      <StyledEditor>
        <AceEditor
          mode={mode}
          theme="monokai"
          editorProps={{ $blockScrolling: true }}
          value={code}
          onChange={value => this.setState({ code: value })}
          setOptions={{ tabSize: 2, fontSize: '12px' }}
          width="100%"
          height={height as string}
          showGutter={false}
          readOnly={!onChange}
          wrapEnabled
        />
        <StyledButtons>
          <StyledButton onClick={() => onChange(this.state.code)}>
            {changeText}
          </StyledButton>
          <StyledButton onClick={() => onSave(this.state.code)}>
            Save
          </StyledButton>
        </StyledButtons>
      </StyledEditor>
    );
  }
}
