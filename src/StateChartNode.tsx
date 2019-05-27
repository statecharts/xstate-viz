import React from 'react';
import {
  Machine as _Machine,
  StateNode,
  State,
  DelayedTransitionDefinition
} from 'xstate';
import styled from 'styled-components';
import {
  condToString,
  serializeEdge,
  stateActions,
  friendlyEventName,
  getEventDelay
} from './utils';
import { tracker } from './tracker';
import { getEdges } from 'xstate/lib/graph';
import { StyledButton } from './Button';

const StyledChildStates = styled.div`
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  padding-bottom: 1rem;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  min-height: 1rem;
`;

const StyledChildStatesToggle = styled.button`
  appearance: none;
  display: inline-flex;
  height: 1rem;
  width: 1rem;
  justify-content: center;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;

  &:not(:hover) {
    opacity: 0.5;
  }

  &:before {
    --dot-size: 3px;
    content: '';
    display: block;
    height: var(--dot-size);
    width: var(--dot-size);
    border-radius: 50%;
    background: var(--toggle-color, gray);
    flex-shrink: 0;
    box-shadow: calc(-1 * (var(--dot-size) + 1px)) 0 var(--toggle-color, gray),
      calc(var(--dot-size) + 1px) 0 var(--toggle-color, gray);
  }

  &:focus {
    outline: none;
  }
`;

const StyledStateNodeHeader = styled.header`
  position: absolute;
  z-index: 1;
  padding: 0.25rem 0;
  bottom: calc(100% + var(--border-width, 0));
  left: calc(-1 * var(--border-width));
  display: flex;
  flex-direction: row;

  &:before {
    display: none;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: var(--color-app-background);
  }

  &[data-type-symbol='history' i] {
    --symbol-color: orange;
  }

  &[data-type-symbol] {
    padding-right: 5em;

    &:after {
      content: attr(data-type-symbol);
      position: absolute;
      top: 0;
      right: 0;
      border-bottom-left-radius: 0.25rem;
      background: var(--symbol-color, gray);
      color: white;
      padding: 0.25rem 0.5rem;
      font-weight: bold;
      font-size: 0.75em;
    }
  }
`;

const StyledStateNode = styled.div`
  --color-shadow: rgba(0, 0, 0, 0.05);
  --color-node-border: var(--color-border);
  position: relative;
  display: inline-block;
  border-radius: 0.25rem;
  text-align: left;
  border: 2px solid var(--color-node-border);
  margin: 1rem;
  flex-grow: 0;
  flex-shrink: 1;
  box-shadow: 0 0.5rem 1rem var(--color-shadow);
  background: white;
  color: #313131;
  min-height: 1rem;

  &[data-type~='machine'] {
    border: none;
    box-shadow: none;
    width: 100%;
    background: none;
    margin: 2rem 0;

    > ${StyledStateNodeHeader} {
      left: 1rem;
      font-size: 1rem;
    }

    > ul {
      padding-right: 1.5rem;
    }
  }
  &:not([data-type~='machine']) {
    /* opacity: 0.75; */
  }

  &:not([data-open='true']) > ${StyledChildStates} > * {
    display: none;
  }

  ${StyledChildStatesToggle} {
    position: absolute;
    bottom: 0;
    right: 0;
  }

  &[data-type~='machine'] > ${StyledChildStatesToggle} {
    display: none;
  }

  &[data-active] {
    --color-node-border: var(--color-primary);
    --color-shadow: var(--color-primary-shadow);
    opacity: 1;

    > ${StyledStateNodeHeader} {
      color: var(--color-primary);
    }

    > ${StyledChildStatesToggle} {
      --toggle-color: var(--color-primary);
    }
  }

  &[data-preview]:not([data-active]) {
    --color-node-border: var(--color-primary-faded);
  }

  &[data-type~='parallel']
    > ${StyledChildStates}
    > *:not(${StyledChildStatesToggle}) {
    border-style: dashed;
  }

  &[data-type~='final'] {
    &:after {
      content: '';
      position: absolute;
      top: -5px;
      left: -5px;
      width: calc(100% + 10px);
      height: calc(100% + 10px);
      border: 2px solid var(--color-node-border);
      pointer-events: none;
      border-radius: 6px;
      z-index: 1;
    }
  }

  &:before {
    content: attr(data-key);
    color: transparent;
    visibility: hidden;
    height: 1px;
    display: block;
  }
`;

const StyledEvents = styled.ul`
  padding: 0;
  margin: 0.5rem 0;
  list-style: none;

  &:empty {
    display: none;
  }
`;

const StyledStateNodeActions = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  margin-bottom: 0.5rem;
`;

const StyledEvent = styled.li`
  list-style: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;

  &:not(:last-child) {
    margin-bottom: 0.25rem;
  }

  &[data-disabled] > ${StyledStateNodeActions} {
    opacity: 0.7;
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
  overflow: hidden;

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
  height: 1rem;
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

  &[data-action-type]:before {
    content: attr(data-action-type) ' / ';
    margin-right: 0.5ch;
    font-weight: bold;
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

interface StateChartNodeProps {
  stateNode: StateNode;
  current: State<any, any>;
  preview?: State<any, any>;
  onEvent: (event: string) => void;
  onPreEvent: (event: string) => void;
  onExitPreEvent: () => void;
  onReset?: () => void;
  toggledStates: Record<string, boolean>;
  toggleEditorPanel?: () => void;
}

export class StateChartNode extends React.Component<StateChartNodeProps> {
  state = {
    toggled: true
  };

  stateRef = React.createRef<any>();

  public componentDidUpdate() {
    tracker.update(this.props.stateNode.id, this.stateRef.current);
  }
  public render(): JSX.Element {
    const {
      stateNode,
      current,
      preview,
      onEvent,
      onPreEvent,
      onExitPreEvent,
      onReset,
      toggleEditorPanel
    } = this.props;
    const isActive =
      !stateNode.parent ||
      current.matches(stateNode.path.join('.')) ||
      undefined;
    const isPreview = preview
      ? preview.matches(stateNode.path.join('.')) || undefined
      : undefined;

    const dataType = stateNode.parent
      ? stateNode.type
      : `machine ${stateNode.type}`;

    return (
      <StyledStateNode
        key={stateNode.id}
        data-key={stateNode.key}
        data-id={stateNode.id}
        data-type={dataType}
        data-active={isActive && stateNode.parent}
        data-preview={isPreview && stateNode.parent}
        data-open={this.state.toggled || undefined}
        ref={this.stateRef}
        // data-open={true}
      >
        <StyledStateNodeHeader
          style={{
            // @ts-ignore
            '--depth': stateNode.path.length
          }}
        >
          <strong>{stateNode.key}</strong>
          {stateNode.path.length === 0 ? (
            <>
              <StyledButton
                data-variant="reset"
                onClick={onReset ? () => onReset() : undefined}
              >
                Reset
              </StyledButton>
              {toggleEditorPanel ? (
                <StyledButton
                  data-variant="reset"
                  onClick={
                    toggleEditorPanel ? () => toggleEditorPanel() : undefined
                  }
                >
                  Toggle Editor
                </StyledButton>
              ) : null}
            </>
          ) : null}
        </StyledStateNodeHeader>
        {!!stateActions(stateNode).length && (
          <StyledStateNodeActions>
            {stateNode.definition.onEntry.map(action => {
              const actionString = action.type;
              return (
                <StyledStateNodeAction
                  key={actionString}
                  data-action-type="entry"
                >
                  {actionString}
                </StyledStateNodeAction>
              );
            })}
            {stateNode.definition.onExit.map(action => {
              const actionString = action.type;
              return (
                <StyledStateNodeAction
                  key={actionString}
                  data-action-type="exit"
                >
                  {actionString}
                </StyledStateNodeAction>
              );
            })}
          </StyledStateNodeActions>
        )}
        <StyledEvents>
          {getEdges(stateNode, { depth: 0 }).map(edge => {
            const { event: ownEvent } = edge;
            const isBuiltInEvent =
              ownEvent.indexOf('xstate.') === 0 ||
              ownEvent.indexOf('done.') === 0 ||
              ownEvent === '';

            const disabled: boolean =
              !isActive || current.nextEvents.indexOf(ownEvent) === -1;
            // || (!!edge.cond &&
            //   typeof edge.cond === 'function' &&
            //   !edge.cond(current.context, { type: ownEvent }, { cond: undefined, }));
            const cond = edge.cond
              ? `[${edge.cond.toString().replace(/\n/g, '')}]`
              : '';

            let delay = isBuiltInEvent ? getEventDelay(ownEvent) : false;

            if (typeof delay === 'string') {
              const delayExpr = stateNode.machine.options.delays[delay];
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
                  onClick={() =>
                    !isBuiltInEvent ? onEvent(ownEvent) : undefined
                  }
                  onMouseOver={() => onPreEvent(ownEvent)}
                  onMouseOut={() => onExitPreEvent()}
                  disabled={disabled}
                  data-delay={
                    (edge.transition as DelayedTransitionDefinition<any, any>)
                      .delay
                  }
                  data-builtin={isBuiltInEvent || undefined}
                  data-id={serializeEdge(edge)}
                  title={ownEvent}
                >
                  <span>{friendlyEventName(ownEvent)}</span>
                  <StyledEventDot />
                </StyledEventButton>

                {!!(edge.transition.actions.length || edge.transition.cond) && (
                  <StyledStateNodeActions>
                    {edge.transition.cond && (
                      <StyledStateNodeAction data-guard>
                        {condToString(edge.transition.cond)}
                      </StyledStateNodeAction>
                    )}

                    {edge.transition.actions.map((action, i) => {
                      const actionString = action.type;
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
                )}
              </StyledEvent>
            );
          })}
        </StyledEvents>
        {Object.keys(stateNode.states).length ? (
          <StyledChildStates>
            {Object.keys(stateNode.states || []).map(key => {
              const childStateNode = stateNode.states[key];

              return (
                <StateChartNode
                  stateNode={childStateNode}
                  current={current}
                  preview={preview}
                  key={childStateNode.id}
                  onEvent={onEvent}
                  onPreEvent={onPreEvent}
                  onExitPreEvent={onExitPreEvent}
                  toggledStates={this.props.toggledStates}
                />
              );
            })}
          </StyledChildStates>
        ) : null}
        {Object.keys(stateNode.states).length > 0 ? (
          <StyledChildStatesToggle
            title={this.state.toggled ? 'Hide children' : 'Show children'}
            onClick={e => {
              e.stopPropagation();
              this.setState({ toggled: !this.state.toggled }, () => {
                tracker.updateAll();
              });
            }}
          />
        ) : null}
      </StyledStateNode>
    );
  }
}
