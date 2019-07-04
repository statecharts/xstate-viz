import React from 'react';
import {
  Machine as _Machine,
  StateNode,
  State,
  DelayedTransitionDefinition,
  Interpreter
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
import { actionTypes } from 'xstate/lib/actions';
import { StateChartAction } from './StateChartAction';
import { StateChartGuard } from './StateChartGuard';

const StyledChildStates = styled.div`
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  display: flex;
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

const StyledToken = styled.div`
  background: var(--color-border);
  color: inherit;
  font-weight: bold;
`;

const StyledStateNodeHeader = styled.header`
  z-index: 1;
  display: flex;
  flex-direction: row;
  white-space: nowrap;

  > * {
    padding: 0.25rem;
  }

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
  --state-event-gap: 0.5rem;
  position: relative;
  margin: 0.5rem;
  flex-grow: 0;
  flex-shrink: 1;
  // background: rgba(255, 255, 255, 0.5);
  color: #313131;
  min-height: 1rem;
  display: inline-grid;
  grid-template-columns: auto 1fr;
  grid-column-gap: var(--state-event-gap);
  border: none;

  &[data-type~='machine'] {
    display: grid;
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
    // opacity: 0.75;
  }

  &:not([data-open='true']) ${StyledChildStates} > * {
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

  &[data-type~='final'] {
    > div:first-child:after {
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

  &:hover {
    z-index: 2;
  }
`;

const StyledStateNodeState = styled.div`
  grid-column: 1 / 2;
  align-self: self-start;
  border-radius: 0.25rem;
  border: 2px solid var(--color-node-border);
  text-align: left;
  box-shadow: 0 0.5rem 1rem var(--color-shadow);
  color: #313131;
  min-height: 1rem;
  z-index: 1;

  &[data-type='parallel'] > ${StyledChildStates} > ${StyledStateNode} > & {
    border-style: dashed;
  }
`;

const StyledStateNodeEvents = styled.div`
  grid-column: 2 / 3;
  padding: 0;
  margin-right: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  &:empty {
    display: none;
  }
`;

export const StyledStateNodeActions = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  margin-bottom: 0.5rem;
  z-index: 1;

  &:empty {
    display: none;
  }
`;

const StyledEventDot = styled.div`
  --size: 0.5rem;
  position: relative;
  display: inline-block;
  height: var(--size);
  width: var(--size);
  border-radius: 50%;
  background-color: white;

  &:before {
    content: '';
    position: absolute;
    top: -0.25rem;
    right: 0;
    width: calc(100% + 0.5rem);
    height: calc(100% + 0.5rem);
    border-radius: inherit;
    background-color: var(--color-event);
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    right: 0.25rem;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background-color: white;
  }
`;

const StyledEventButton = styled.button`
  --color-event: var(--color-primary);
  padding: 0;
  position: relative;
  appearance: none;
  border: 2px solid var(--color-event);
  background: white;
  color: white;
  font-size: 0.75em;
  font-weight: bold;
  cursor: pointer;
  border-radius: 2rem;
  line-height: 1;
  display: inline-flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;

  > * {
    padding: 0.15rem 0.35rem;
  }

  > label {
    background-color: var(--color-event);
    cursor: inherit;

    &:empty {
      display: none;
    }
  }

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
  &[data-delay] {
    > * {
      background: none;
    }

    &:not([disabled]):before {
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
    color: black;
    font-style: italic;
  }

  &[data-transient] {
    > ${StyledEventDot} {
      order: -1;
    }
  }
`;

const StyledEvent = styled.div`
  list-style: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;

  &:not(:last-child) {
    margin-bottom: 0.25rem;
  }

  &[data-disabled] > ${StyledStateNodeActions} {
    opacity: 0.7;
  }

  &[data-internal] {
  }
`;

const StyledStateNodeAction = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;

  &:before {
    content: '→';
    margin-right: 0.5ch;
  }
`;

const StyledActiveAnim = styled.div`
  position: absolute;
  z-index: 0;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  animation: bg 1s both;
  background: var(--color-primary);
  will-change: opacity;

  @keyframes bg {
    from {
      opacity: 0.5;
    }
    to {
      opacity: 0;
    }
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
  onSelectServiceId: (serviceId: string) => void;
  toggledStates: Record<string, boolean>;
  transitionCount: number;
  level: number;
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
      onReset
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
        data-type={dataType}
        data-active={isActive && stateNode.parent}
        data-preview={isPreview && stateNode.parent}
        data-open={this.state.toggled || undefined}
        ref={this.stateRef}
        // data-open={true}
      >
        <StyledStateNodeState data-id={stateNode.id} data-type={dataType}>
          {isActive && (dataType === 'atomic' || dataType === 'final') && (
            <StyledActiveAnim
              key={this.props.transitionCount}
              style={{
                // @ts-ignore
                '--level': this.props.level
              }}
            />
          )}
          <StyledStateNodeHeader
            style={{
              // @ts-ignore
              '--depth': stateNode.path.length
            }}
          >
            {dataType === 'history' && <StyledToken>H</StyledToken>}
            <strong>{stateNode.key}</strong>
            {stateNode.path.length === 0 ? (
              <StyledButton
                data-variant="reset"
                onClick={onReset ? () => onReset() : undefined}
              >
                Reset
              </StyledButton>
            ) : null}
          </StyledStateNodeHeader>
          {!!stateActions(stateNode).length && (
            <>
              <StyledStateNodeActions data-title="entry">
                {stateNode.definition.onEntry.map(action => {
                  const actionString = action.type;

                  return (
                    <StateChartAction
                      key={actionString}
                      data-action-type="entry"
                      action={action}
                    />
                  );
                })}
              </StyledStateNodeActions>
              <StyledStateNodeActions data-title="exit">
                {stateNode.definition.onExit.map(action => {
                  const actionString = action.type;
                  return (
                    <StateChartAction
                      key={actionString}
                      data-action-type="exit"
                      action={action}
                    />
                  );
                })}
              </StyledStateNodeActions>
            </>
          )}
          <StyledStateNodeActions data-title="invoke">
            {stateNode.invoke.map(invocation => {
              console.log(invocation);

              return (
                <span
                  onClick={() => this.props.onSelectServiceId(invocation.id)}
                >
                  {invocation.id}
                </span>
              );
            })}
          </StyledStateNodeActions>
          {Object.keys(stateNode.states).length ? (
            <StyledChildStates>
              {Object.keys(stateNode.states || []).map(key => {
                const childStateNode = stateNode.states[key];

                return (
                  <StateChartNode
                    stateNode={childStateNode}
                    level={this.props.level + 1}
                    current={current}
                    preview={preview}
                    key={childStateNode.id}
                    onEvent={onEvent}
                    onPreEvent={onPreEvent}
                    onExitPreEvent={onExitPreEvent}
                    toggledStates={this.props.toggledStates}
                    onSelectServiceId={this.props.onSelectServiceId}
                    transitionCount={this.props.transitionCount}
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
        </StyledStateNodeState>
        <StyledStateNodeEvents>
          {getEdges(stateNode, { depth: 0 }).map(edge => {
            const { event: ownEvent } = edge;
            const isBuiltInEvent =
              ownEvent.indexOf('xstate.') === 0 ||
              ownEvent.indexOf('done.') === 0;
            const guard = edge.transition.cond;
            const valid =
              guard && guard.predicate
                ? guard.predicate(current.context, current.event, {
                    cond: guard
                  })
                : true;
            const disabled: boolean =
              !valid ||
              !isActive ||
              current.nextEvents.indexOf(ownEvent) === -1;
            // || (!!edge.cond &&
            //   typeof edge.cond === 'function' &&
            //   !edge.cond(current.context, { type: ownEvent }, { cond: undefined, }));

            let delay = isBuiltInEvent ? getEventDelay(ownEvent) : false;

            if (typeof delay === 'string') {
              const delayExpr = stateNode.machine.options.delays[delay];
              delay =
                typeof delayExpr === 'number'
                  ? delayExpr
                  : delayExpr(current.context, current.event);
            }

            const isTransient = ownEvent === '';

            return (
              <StyledEvent
                style={{
                  //@ts-ignore
                  '--delay': delay || 0
                }}
                data-disabled={disabled || undefined}
                key={serializeEdge(edge)}
                data-internal={edge.transition.internal || undefined}
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
                  data-transient={isTransient || undefined}
                  data-id={serializeEdge(edge)}
                  title={ownEvent}
                >
                  <label>{friendlyEventName(ownEvent)}</label>
                  {edge.transition.cond && (
                    <StateChartGuard
                      guard={edge.transition.cond}
                      state={current}
                    />
                  )}
                </StyledEventButton>
                {!!(edge.transition.actions.length || edge.transition.cond) && (
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
                )}
              </StyledEvent>
            );
          })}
        </StyledStateNodeEvents>
      </StyledStateNode>
    );
  }
}
