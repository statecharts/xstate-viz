import React, { Component } from 'react';
import AceEditor, { AceEditorProps } from 'react-ace';
import 'brace/theme/monokai';
import 'brace/mode/javascript';
import { StyledButton } from './Button';
import styled from 'styled-components';

interface EditorProps extends AceEditorProps {
  code: string;
  onChange?: (code: string) => void;
  height?: string;
  changeText?: string;
  mode?: string;
}

export const StyledEditor = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem 0 0 1rem;
`;

export class Editor extends Component<EditorProps> {
  state = {
    code: this.props.code
  };
  render() {
    const { code } = this.state;
    const {
      onChange,
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
        />
        {onChange ? (
          <StyledButton onClick={() => onChange(this.state.code)}>
            {changeText}
          </StyledButton>
        ) : null}
      </StyledEditor>
    );
  }
}
