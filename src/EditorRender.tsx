import React from 'react';
import { Editor } from './Editor';
import { Field } from './Field';
import styled from 'styled-components';
import { State, StateNode, EventObject, OmniEventObject } from 'xstate';
import { toMachine } from './machineUtils';

const StyledPre = styled.pre`
  overflow: auto;
`;

type EditorRenderProps = {
  view: string;
  current: State<any, any>;
  code: string;
  onEditorChange: {
    definition: (code: string) => void;
    state: (eventData: any) => void;
  };
};

export function EditorRender({
  view,
  current,
  code,
  onEditorChange
}: EditorRenderProps) {
  switch (view) {
    case 'definition':
      return (
        <Editor
          code={code}
          onChange={code => {
            onEditorChange.definition(code);
          }}
        />
      );
    case 'state':
      return (
        <>
          <div style={{ overflowY: 'auto' }}>
            <Field label="Value">
              <StyledPre>{JSON.stringify(current.value, null, 2)}</StyledPre>
            </Field>
            <Field label="Context" disabled={!current.context}>
              {current.context !== undefined ? (
                <StyledPre>
                  {JSON.stringify(current.context, null, 2)}
                </StyledPre>
              ) : null}
            </Field>
            <Field label="Actions" disabled={!current.actions.length}>
              {!!current.actions.length && (
                <StyledPre>
                  {JSON.stringify(current.actions, null, 2)}
                </StyledPre>
              )}
            </Field>
          </div>
          <Field
            label="Event"
            style={{
              marginTop: 'auto',
              borderTop: '1px solid #777',
              flexShrink: 0,
              background: 'var(--color-sidebar)'
            }}
          >
            <Editor
              height="5rem"
              code={'{type: ""}'}
              changeText="Send event"
              onChange={code => {
                try {
                  const eventData = eval(`(${code})`);

                  onEditorChange.state(eventData);
                } catch (e) {
                  console.error(e);
                  alert(
                    'Unable to send event.\nCheck the console for more info.'
                  );
                }
              }}
            />
          </Field>
        </>
      );
    default:
      return null;
  }
}
