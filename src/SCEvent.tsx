import React, { useMemo } from 'react';
import { Edge, State, DelayedTransitionDefinition, Machine } from 'xstate';
import {
  getEventDelay,
  serializeEdge,
  friendlyEventName,
  isBuiltInEvent
} from './utils';
import styled from 'styled-components';
import { StyledStateNodeActions } from './StateChartNode';
import { StateChartGuard } from './StateChartGuard';
import { actionTypes } from 'xstate/lib/actions';
import { useMachine } from '@xstate/react';
import { Popover, StyledPopover } from './Popover';
import AceEditor from 'react-ace';

const StyledEvent = styled.div`
  list-style: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  &:not(:last-child) {
    margin-bottom: 0.25rem;
  }

  &[data-disabled] > ${StyledStateNodeActions} {
    opacity: 0.7;
  }

  &:hover ${StyledPopover} {
    opacity: 1;
    pointer-events: auto;
  }
`;

const StyledEventButton = styled.button`
  --color-event: var(--color-primary);
  position: relative;
  appearance: none;
  background-color: var(--color-event);
  border: none;
  color: white;
  font-size: 0.75em;
  font-weight: bold;
  padding: 0.25rem 0.25rem 0.25rem 0.5rem;
  cursor: pointer;
  border-radius: 2rem;
  line-height: 1;
  display: inline-flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-right: -0.5rem;
  margin-left: 0.5rem;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
  // overflow: hidden;

  &:not(:disabled):not([data-builtin]):hover {
    --color-event: var(--color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    --color-event: var(--color-disabled);
  }

  &:focus {
    outline: none;
  }

  // duration
  &[data-delay]:not([disabled]) {
    &:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--color-event);
      animation: move-left calc(var(--delay) * 1ms) linear;
      z-index: 0;
      opacity: 0.5;
    }
  }

  @keyframes move-left {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: none;
    }
  }

  &[data-builtin] {
    background-color: transparent;
    color: black;
    font-style: italic;
  }
`;

const StyledStateNodeAction = styled.li`
  display: flex;
  flex-direction: row;
  align-items: center;
  list-style: none;
  padding: 0 0.5rem;
  margin: 0;

  &[data-guard] {
    &:before,
    &:after {
      font-weight: bold;
    }
    &:before {
      content: '[';
      margin-right: 0.5ch;
    }
    &:after {
      content: ']';
      margin-left: 0.5ch;
    }
  }
`;
const StyledEventDot = styled.div`
  position: relative;
  display: inline-block;
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 50%;
  background-color: white;
  margin-left: 0.5rem;

  &:before {
    content: '';
    position: absolute;
    top: -0.25rem;
    left: -0.25rem;
    width: calc(100% + 0.5rem);
    height: calc(100% + 0.5rem);
    border-radius: 50%;
    background-color: var(--color-event);
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: white;
  }
`;

type EventHandler = (event: any) => void;

const eventPopoverMachine = Machine({
  id: 'event-popover',
  initial: 'button',
  states: {
    button: {
      on: {
        CLICK: 'editor'
      }
    },
    editor: {}
  }
});

export const SCEvent: React.SFC<{
  edge: Edge<any, any>;
  current: State<any, any>;
  onEvent: EventHandler;
  onPreEvent: EventHandler;
  onExitPreEvent: () => void;
}> = ({ edge, current, onEvent, onPreEvent, onExitPreEvent }) => {
  const { event: ownEvent } = edge;

  // const disabled: boolean =
  //   !isActive || current.nextEvents.indexOf(ownEvent) === -1;
  const disabled = false;

  let delay = isBuiltInEvent ? getEventDelay(ownEvent) : false;

  if (typeof delay === 'string') {
    const delayExpr = edge.source.machine.options.delays[delay];
    delay =
      typeof delayExpr === 'number'
        ? delayExpr
        : delayExpr(current.context, current.event);
  }

  return (
    <StyledEvent
      style={{
        //@ts-ignore
        '--delay': delay || 0
      }}
      data-disabled={disabled || undefined}
      key={serializeEdge(edge)}
    >
      <StyledEventButton
        // onClick={() => (!isBuiltInEvent ? onEvent(ownEvent) : undefined)}
        // onMouseDown={e => send(e)}
        // onMouseUp={e => send(e)}
        onMouseOver={() => onPreEvent(ownEvent)}
        onMouseOut={() => onExitPreEvent()}
        disabled={disabled}
        data-delay={
          (edge.transition as DelayedTransitionDefinition<any, any>).delay
        }
        data-builtin={isBuiltInEvent || undefined}
        data-id={serializeEdge(edge)}
        title={ownEvent}
      >
        <span>{friendlyEventName(ownEvent)}</span>
        <StyledEventDot />
      </StyledEventButton>

      {!!(edge.transition.actions.length || edge.transition.cond) && (
        <>
          {edge.transition.cond && (
            <StyledStateNodeAction data-guard>
              <StateChartGuard guard={edge.transition.cond} state={current} />
            </StyledStateNodeAction>
          )}

          <StyledStateNodeActions>
            {edge.transition.actions.map((action, i) => {
              const actionString =
                action.type === actionTypes.assign
                  ? JSON.stringify(action.assignments!)
                  : action.type;

              return (
                <StyledStateNodeAction
                  data-action-type="do"
                  key={actionString + ':' + i}
                >
                  {actionString}
                </StyledStateNodeAction>
              );
            })}
          </StyledStateNodeActions>
        </>
      )}
    </StyledEvent>
  );
};
