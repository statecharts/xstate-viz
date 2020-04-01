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
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: baseline;
  max-width: 30ch;
  padding: 0 0.25rem;
  line-height: 1rem;

  &:hover > ${StyledPopover} {
    opacity: 1;
  }

  &:before {
    font-weight: bold;
    color: var(--color-gray);
    margin-right: 0.25rem;
    font-size: 75%;
    content: attr(data-action-type) ' /';
    white-space: nowrap;
  }
`;

const StyledStateChartActionText = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const StateChartAction: React.SFC<StateChartActionProps> = ({
  action,
  ...dataAttrs
}) => {
  switch (action.type) {
    case actionTypes.assign:
      return typeof action.assignment === 'function' ? (
        <StyledStateChartAction {...dataAttrs} title="assign">
          <strong>assign</strong>
        </StyledStateChartAction>
      ) : (
        <>
          {Object.keys(action.assignment).map(key => {
            return (
              <StyledStateChartAction
                key={key}
                title={`assign ${key}`}
                {...dataAttrs}
              >
                <Popover>
                  <Code>{action.assignment[key] + ''}</Code>
                </Popover>
                <StyledStateChartActionText>
                  <strong>assign</strong> {key}
                </StyledStateChartActionText>
              </StyledStateChartAction>
            );
          })}
        </>
      );

    case actionTypes.invoke:
      return (
        <StyledStateChartAction {...dataAttrs} title={`invoke ${action.id}`}>
          <StyledStateChartActionText>{action.id}</StyledStateChartActionText>
        </StyledStateChartAction>
      );

    case actionTypes.send:
      const sendAction = action as SendActionObject<any, any>;

      if (
        sendAction.event.type &&
        sendAction.event.type.indexOf('xstate.after') === 0) {
        return null;
      }

      return (
        <StyledStateChartAction
          {...dataAttrs}
          title={`send ${sendAction.event.type} to "${JSON.stringify(
            sendAction.to
          )}"`}
        >
          <StyledStateChartActionText>
            <em>send</em> {sendAction.event.type}{' '}
            {sendAction.to ? `to ${JSON.stringify(sendAction.to)}` : ''}
          </StyledStateChartActionText>
        </StyledStateChartAction>
      );

    case actionTypes.log:
      return (
        <StyledStateChartAction {...dataAttrs} title="log">
          <StyledStateChartActionText>
            <em>log</em>
          </StyledStateChartActionText>
        </StyledStateChartAction>
      );

    default:
      if (
        action.type.indexOf('xstate.') === 0 &&
        action.type !== 'xstate.invoke'
      ) {
        return null;
      }

      return (
        <StyledStateChartAction {...dataAttrs} title={action.type}>
          <StyledStateChartActionText>{action.type}</StyledStateChartActionText>
        </StyledStateChartAction>
      );
  }
};
