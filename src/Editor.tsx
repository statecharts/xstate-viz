import React, { Component } from "react";
import AceEditor from "react-ace";
import "brace/theme/monokai";
import "brace/mode/javascript";

interface EditorProps {
  code: string;
  onChange?: (code: string) => void;
}

export class Editor extends Component<EditorProps> {
  state = {
    code: this.props.code
  };
  render() {
    const { code } = this.state;
    const { onChange } = this.props;

    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <AceEditor
          mode="javascript"
          theme="monokai"
          editorProps={{ $blockScrolling: true }}
          value={code}
          onChange={value => this.setState({ code: value })}
          setOptions={{ tabSize: 2 }}
          width="100%"
          height="100%"
          showGutter={false}
          readOnly={!onChange}
        />
        {onChange ? (
          <button onClick={() => onChange(this.state.code)}>Update</button>
        ) : null}
      </div>
    );
  }
}
