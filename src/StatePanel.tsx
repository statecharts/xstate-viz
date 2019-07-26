import React, { useState } from 'react';
import { State, Interpreter } from 'xstate';
import styled from 'styled-components';

const StyledField = styled.div`
  &:not(:last-child) {
    margin-bottom: 1rem;
  }

  margin-top: 0.5rem;
  width: 100%;
  overflow: hidden;

  > label {
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.5em;
    font-weight: bold;
    opacity: 0.5;
  }

  &[data-empty] {
    opacity: 0.5;
    > label {
      margin-bottom: 0;
    }
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
      data-empty={!children || undefined}
    >
      <label>{label}</label>
      {children}
    </StyledField>
  );
}

const StyledDetails = styled.details`
  margin: 0;
  padding: 0 1rem;

  & & {
    border-left: 2px solid #737373;
  }

  > summary {
    font-weight: bold;
    font-size: 1rem;
  }
`;

const StyledPanelAction = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: 1ch;

  & + & {
    margin-top: 0.5rem;
  }

  pre {
    margin: 0;
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
    <StyledDetails key={service.id} open={true}>
      <summary>{service.id}</summary>
      <Field label="state">
        <pre>{JSON.stringify(simplifiedState, null, 2)}</pre>
      </Field>
      <Field label="actions">
        {state.actions.map((action, i) => {
          return (
            <StyledPanelAction key={i}>
              {Object.keys(action).map(key => {
                const value = action[key];
                if (value === undefined) {
                  return null;
                }
                return (
                  <React.Fragment key={key}>
                    <strong>{key}:</strong>
                    <pre>{JSON.stringify(action[key], null, 2)}</pre>
                  </React.Fragment>
                );
              })}
            </StyledPanelAction>
          );
        })}
      </Field>
      <Field label="Children">
        {Array.from((service as any).children.values()).map((child: any, i) => {
          if (!child.state) {
            return null;
          }

          return <StatePanel state={child.state} service={child} key={i} />;
        })}
      </Field>
    </StyledDetails>
  );
};
