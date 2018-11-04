import React from "react";
import { Machine as _Machine, StateNode, State, EventObject } from "xstate";
import styled from "styled-components";
import { transitions, condToString, serializeEdge } from "./utils";
import { tracker } from "./tracker";
import { getEdges } from "xstate/lib/graph";

const StyledChildStatesToggle = styled.button`
  display: inline-block;
  appearance: none;
  background: transparent;
  border: var(--border-width) solid #dedede;
  border-bottom: none;
  border-right: none;
  border-radius: 0.25rem 0 0 0;

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

  &:before {
    display: none;
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: var(--color-app-background);
  }

  &[data-type-symbol="history" i] {
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

const StyledState = styled.div`
  --color-shadow: rgba(0, 0, 0, 0.05);
  --color-node-border: var(--color-border);
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

  &[data-type~="machine"] {
    border: none;
    box-shadow: none;
    width: 100%;
    background: none;
    margin: 1rem 0;

    > ${StyledStateNodeHeader} {
      left: 1rem;
    }

    > ul {
      padding-right: 1.5rem;
    }
  }
  &:not([data-type~="machine"]) {
    // opacity: 0.75;
  }

  & > .children {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    min-height: 1rem;
  }

  &:not([data-open="true"]) > .children {
    display: grid;
    grid-template-rows: 1rem;
    grid-template-columns: 1fr 1rem;

    > * {
      width: 1rem;
      height: 1rem;
      grid-row: 1;
      grid-column: 2;
      margin: 0;
      max-width: initial;

      > * {
        display: none;
      }
    }
  }

  > .children {
    display: flex;
    padding-bottom: 1rem;
  }

  ${StyledChildStatesToggle} {
    position: absolute;
    bottom: 0;
    right: 0;
  }

  &:not[data-active] {
  }

  &[data-active] {
    --color-node-border: var(--color-primary);
    --color-shadow: var(--color-primary-shadow);
    opacity: 1;

    > ${StyledStateNodeHeader} {
      color: var(--color-primary);
    }
  }

  &[data-preview]:not([data-active]) {
    --color-node-border: var(--color-primary-faded);
  }

  &[data-type~="parallel"] > .children > *:not(${StyledChildStatesToggle}) {
    border-style: dashed;
  }

  &[data-type~="final"] {
    &:after {
      content: "";
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
  }
`;

const StyledEvents = styled.ul`
  padding: 0;
  margin: 0;
  list-style: none;
  padding: 0 0.5rem 0.5rem 0.5rem;

  &:empty {
    display: none;
  }
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
`;

const StyledEventButton = styled.button`
  --color-event: var(--color-primary);
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
  margin-right: -1rem;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
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
  &[data-delay]:not([disabled]):before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--color-event);
    animation: move-left calc(var(--delay) * 1ms) linear;
    z-index: 0;
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
  }
`;

const StyledTransitionAction = styled.div`
  &:before {
    content: "do / ";
    font-weight: bold;
  }
`;

const StyledStateNodeActions = styled.ul`
  list-style: none;
  padding: 0 0.5rem;
  margin: 0;
  margin-bottom: 0.5rem;
`;
const StyledStateNodeAction = styled.li`
  list-style: none;
  padding: 0;
  margin: 0;

  &:before {
    content: attr(data-action-type) " / ";
    font-weight: bold;
  }
`;
const StyledEventDot = styled.div`
  display: inline-block;
  height: 0.5rem;
  width: 0.5rem;
  border-radius: 50%;
  background-color: white;
  margin-left: 0.5rem;

  &:before {
    content: "";
    position: absolute;
    top: -0.25rem;
    left: -0.25rem;
    width: calc(100% + 0.5rem);
    height: calc(100% + 0.5rem);
    border-radius: 50%;
    background-color: var(--color-event);
  }

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: white;
  }
`;

function friendlyEventName(event: string) {
  let match = event.match(/^xstate\.after\((\d+)\)/);

  if (match) {
    return `after ${match[1]}ms`;
  }

  match = event.match(/^done\.state/);

  if (match) {
    return `(done)`;
  }

  if (event === "") {
    return "?";
  }

  return event;
}

interface StateChartNodeProps {
  stateNode: StateNode;
  current: State<any, any>;
  preview?: State<any, any>;
  onEvent: (event: string) => void;
  onPreEvent: (event: string) => void;
  onExitPreEvent: () => void;
  toggled: boolean;
  onToggle: (id: string) => void;
  toggledStates: Record<string, boolean>;
}

export class StateChartNode extends React.Component<StateChartNodeProps> {
  state = {
    toggled: this.props.toggled
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
      onExitPreEvent
    } = this.props;
    const isActive = current.matches(stateNode.path.join(".")) || undefined;
    const isPreview = preview
      ? preview.matches(stateNode.path.join(".")) || undefined
      : undefined;

    const dataType = stateNode.parent
      ? stateNode.type
      : `machine ${stateNode.type}`;

    return (
      <StyledState
        key={stateNode.id}
        data-key={stateNode.key}
        data-id={stateNode.id}
        data-type={dataType}
        data-active={isActive && stateNode.parent}
        data-preview={isPreview && stateNode.parent}
        data-open={this.props.toggled || undefined}
        ref={this.stateRef}
        // data-open={true}
      >
        <StyledStateNodeHeader
          style={{
            // @ts-ignore
            "--depth": stateNode.path.length
          }}
        >
          <strong>{stateNode.key}</strong>
        </StyledStateNodeHeader>
        <StyledStateNodeActions>
          {stateNode.definition.onEntry.map(action => {
            const actionString = JSON.stringify(action);
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
            const actionString = JSON.stringify(action);
            return (
              <StyledStateNodeAction key={actionString} data-action-type="exit">
                {actionString}
              </StyledStateNodeAction>
            );
          })}
        </StyledStateNodeActions>
        <StyledEvents>
          {getEdges(stateNode, { depth: 0 }).map(edge => {
            const { event: ownEvent } = edge;
            const isBuiltInEvent =
              ownEvent.indexOf("xstate.") === 0 ||
              ownEvent.indexOf("done.") === 0;

            const disabled: boolean =
              current.nextEvents.indexOf(ownEvent) === -1 ||
              (!!edge.cond &&
                typeof edge.cond === "function" &&
                !edge.cond(current.context, { type: ownEvent }, {}));
            const cond = edge.cond
              ? `[${edge.cond.toString().replace(/\n/g, "")}]`
              : "";

            return (
              <StyledEvent
                style={{
                  //@ts-ignore
                  "--delay": edge.transition.delay
                }}
                key={serializeEdge(edge)}
              >
                <StyledEventButton
                  onClick={() =>
                    !isBuiltInEvent ? onEvent(ownEvent) : undefined
                  }
                  onMouseOver={() => onPreEvent(ownEvent)}
                  onMouseOut={() => onExitPreEvent()}
                  disabled={disabled}
                  data-delay={edge.transition.delay}
                  data-builtin={isBuiltInEvent || undefined}
                  data-id={serializeEdge(edge)}
                  title={ownEvent}
                >
                  <span>{friendlyEventName(ownEvent)}</span>
                  <StyledEventDot />
                </StyledEventButton>
                {edge.transition.cond && (
                  <div>{condToString(edge.transition.cond)}</div>
                )}
                {edge.transition.actions.map((action, i) => {
                  const actionString = JSON.stringify(action);
                  return (
                    <StyledTransitionAction key={actionString + ":" + i}>
                      {actionString}
                    </StyledTransitionAction>
                  );
                })}
              </StyledEvent>
            );
          })}
        </StyledEvents>
        {Object.keys(stateNode.states).length ? (
          <div className="children">
            {Object.keys(stateNode.states || []).map(key => {
              const childStateNode = stateNode.states[key];

              return (
                <StateChartNode
                  toggled={this.props.toggledStates[childStateNode.id]}
                  stateNode={childStateNode}
                  current={current}
                  preview={preview}
                  key={childStateNode.id}
                  onEvent={onEvent}
                  onPreEvent={onPreEvent}
                  onExitPreEvent={onExitPreEvent}
                  onToggle={this.props.onToggle}
                  toggledStates={this.props.toggledStates}
                />
              );
            })}
            {Object.keys(stateNode.states).length > 0 ? (
              <StyledChildStatesToggle
                onClick={e => {
                  e.stopPropagation();
                  this.props.onToggle(stateNode.id);
                }}
              >
                ...
              </StyledChildStatesToggle>
            ) : null}
          </div>
        ) : null}
      </StyledState>
    );
  }
}
