import React from 'react';
import { ReactPortal } from 'react';
import { ActionObject, Guard, State, SendActionObject } from 'xstate';
import { actionTypes } from 'xstate/lib/actions';
import styled from 'styled-components';
import { GuardPredicate } from 'xstate';
import { Popover, StyledPopover } from './Popover';
import SyntaxHighlighter from 'react-syntax-highlighter';
// @ts-ignore
import { monokai } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const Code: React.SFC<any> = ({ children }) => {
  return (
    <SyntaxHighlighter
      language="ts"
      style={monokai}
      customStyle={{ margin: 0 }}
    >
      {children}
    </SyntaxHighlighter>
  );
};
interface StateChartActionProps {
  action: ActionObject<any, any>;
}

const StyledStateChartAction = styled.li`
  white-space: nowrap;
  // overflow: hidden;
  text-overflow: ellipsis;
  max-width: 20ch;
  padding: 0.25rem;

  &:hover > ${StyledPopover} {
    opacity: 1;
  }
`;

export const StateChartAction: React.SFC<StateChartActionProps> = ({
  action
}) => {
  switch (action.type) {
    case actionTypes.assign:
      return typeof action.assignment === 'function' ? (
        <StyledStateChartAction>
          <strong>assign</strong>
        </StyledStateChartAction>
      ) : (
        <>
          {Object.keys(action.assignment).map(key => {
            return (
              <StyledStateChartAction key={key} title={`assign ${key}`}>
                <Popover>
                  <Code>{action.assignment[key].toString()}</Code>
                </Popover>
                <strong>assign</strong> {key}
              </StyledStateChartAction>
            );
          })}
        </>
      );

    case actionTypes.send:
      const sendAction = action as SendActionObject<any, any>;

      if (sendAction.event.type.indexOf('xstate.after') === 0) {
        return null;
      }

      return (
        <StyledStateChartAction>
          <strong>send</strong> {sendAction.event.type}{' '}
          {sendAction.to ? `to ${JSON.stringify(sendAction.to)}` : ''}
        </StyledStateChartAction>
      );

    default:
      if (action.type.indexOf('xstate.') === 0) {
        return null;
      }
      return <div>{action.type}</div>;
  }
};
