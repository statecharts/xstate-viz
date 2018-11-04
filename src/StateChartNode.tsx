import React from "react";
import { Machine as _Machine, StateNode, State, EventObject } from "xstate";
import styled from "styled-components";
import { transitions, condToString } from "./utils";

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
  background: rgba(255, 255, 255, 0.5);

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
  display: inline-block;
  border-radius: 0.25rem;
  text-align: left;
  border: 2px solid var(--color-border);
  margin: 1rem;
  flex-grow: 0;
  flex-shrink: 1;
  box-shadow: 0 0.5rem 1rem var(--color-shadow);
  background: white;
  color: #313131;
  max-width: 50%;

  &[data-type~="machine"] {
    border: none;
    box-shadow: none;
    max-width: 100%;
    width: 100%;
    background: none;
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

  &[data-active] {
    border-color: var(--color-primary);
    --color-shadow: var(--color-primary-shadow);
    opacity: 1;

    > ${StyledStateNodeHeader} {
      color: var(--color-primary);
    }
  }

  &[data-preview]:not([data-active]) {
    border-color: var(--color-primary-faded);
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
      border: 2px solid var(--color-border);
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
  appearance: none;
  background-color: var(--color-primary);
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
    background-color: var(--color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    background: var(--color-disabled);
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
    background-color: var(--color-primary);
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

  &:after {
    content: "";
    display: inline-block;
    height: 0.5rem;
    width: 0.5rem;
    border-radius: 50%;
    background-color: white;
    margin-left: 0.5rem;
  }

  &[data-builtin] {
    background-color: var(--color-primary-faded);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    pointer-events: none;
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
        // data-open={true}
      >
        <StyledStateNodeHeader
          style={{
            // @ts-ignore
            "--depth": stateNode.path.length
          }}
          data-type-symbol={
            ["history"].includes(stateNode.type)
              ? stateNode.type.toUpperCase()
              : undefined
          }
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
          {transitions(stateNode).map(transition => {
            const ownEvent = transition.event;
            const isBuiltInEvent =
              ownEvent.indexOf("xstate.") === 0 ||
              ownEvent.indexOf("done.") === 0;
            const disabled: boolean =
              current.nextEvents.indexOf(ownEvent) === -1 ||
              (!!transition.cond &&
                typeof transition.cond === "function" &&
                !transition.cond(current.context, ownEvent, {}));
            const cond = transition.cond
              ? `[${transition.cond.toString().replace(/\n/g, "")}]`
              : "";
            return (
              <StyledEvent
                style={{
                  //@ts-ignore
                  "--delay": transition.delay
                }}
              >
                <StyledEventButton
                  onClick={() => onEvent(ownEvent)}
                  onMouseOver={() => onPreEvent(ownEvent)}
                  onMouseOut={() => onExitPreEvent()}
                  disabled={disabled}
                  data-delay={transition.delay}
                  data-builtin={isBuiltInEvent || undefined}
                  data-id={`${stateNode.id}:${ownEvent}${cond}`}
                >
                  <span>{friendlyEventName(ownEvent)}</span>
                </StyledEventButton>
                {transition.cond && <div>{condToString(transition.cond)}</div>}
                {transition.actions.map((action, i) => {
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
