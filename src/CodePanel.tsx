import React, { useCallback } from 'react';
import { Editor } from './Editor';
import { toMachine } from './StateChart';
import { getEdges } from 'xstate/lib/graph';

interface CodePanelProps {
  code: string;
  onChange: (code: string) => void;
  onSave: (code: string) => void;
}

export const CodePanel: React.FunctionComponent<CodePanelProps> = ({
  code,
  onChange,
  onSave
}) => {
  const handleChange = useCallback(
    (code: string) => {
      try {
        const machine = toMachine(code);
        getEdges(machine);
        onChange(code);
      } catch (e) {
        console.error(e);
      }
    },
    [onChange]
  );

  return <Editor code={code} onChange={handleChange} onSave={onSave} />;
};
