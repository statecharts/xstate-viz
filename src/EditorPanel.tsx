import React from 'react';
import { Editor } from './Editor';

interface EditorPanelProps {
  code: string;
  onChange: (code: string) => void;
  onSave: (code: string) => void;
}

export const EditorPanel: React.FunctionComponent<EditorPanelProps> = ({
  code,
  onChange,
  onSave
}) => {
  return <Editor code={code} onChange={onChange} onSave={onSave} />;
};
