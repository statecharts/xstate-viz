import React from 'react';
import { State, Interpreter } from 'xstate';
import { Editor } from './Editor';
import styled from 'styled-components';

const StyledField = styled.div`
  padding: 1rem 0;
  width: 100%;
  overflow: hidden;

  > label {
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.5em;
    font-weight: bold;
    opacity: 0.5;
  }
`;

interface FieldProps {
  label: string;
  children: any;
  disabled?: boolean;
  style?: any;
}
function Field({ label, children, disabled, style }: FieldProps) {
  return (
    <StyledField
      style={{ ...style, ...(disabled ? { opacity: 0.5 } : undefined) }}
    >
      <label>{label}</label>
      {children}
    </StyledField>
  );
}

const StyledDetails = styled.details`
  margin: 0.5rem 0;
  padding: 0 0.5rem;

  & & {
    border-left: 2px solid white;
  }
`;

export const StatePanel: React.FunctionComponent<{
  state: State<any, any>;
  service: Interpreter<any>;
}> = ({ state, service }) => {
  const simplifiedState = {
    value: state.value,
    context: state.context
  };

  return (
    <StyledDetails key={service.id}>
      <summary>{service.id}</summary>

      <pre>{JSON.stringify(simplifiedState, null, 2)}</pre>
      <Field label="actions">
        {state.actions.map((action, i) => {
          return (
            <div key={i}>
              {Object.keys(action).map(key => {
                const value = action[key];
                if (value === undefined) {
                  return null;
                }
                return (
                  <div key={key}>
                    <strong>{key}:</strong> {JSON.stringify(action[key])}
                  </div>
                );
              })}
            </div>
          );
        })}
      </Field>
      <Field label="Children">
        {Array.from((service as any).children.values()).map((child: any) => {
          return <StatePanel state={child.state} service={child} />;
        })}
      </Field>
    </StyledDetails>
  );

  return (
    <>
      {/* <Editor mode="json" code={JSON.stringify(simplifiedState, null, 2)} /> */}
      <pre>{JSON.stringify(simplifiedState, null, 2)}</pre>
      {Array.from((service as any).children.values()).map((child: any) => {
        return (
          <details key={child.id}>
            <summary>{child.id}</summary>
            <StatePanel state={child.state} service={child} />
          </details>
        );
      })}
      <div>
        {/* <Editor
          height="5rem"
          code={'{type: ""}'}
          changeText="Send event"
          onChange={code => {
            try {
              const eventData = eval(`(${code})`);

              this.state.service.send(eventData);
            } catch (e) {
              console.error(e);
              alert(
                'Unable to send event.\nCheck the console for more info.'
              );
            }
          }}
        /> */}
      </div>
    </>
  );
};
