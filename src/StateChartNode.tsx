import React from "react";
import { Machine as _Machine, StateNode, State, EventObject } from "xstate";
import styled from "styled-components";
import { transitions, condToString } from "./utils";

const StyledChildStatesToggle = styled.button`
  display: inline-block;
  appearance: none;
  background: transparent;
  border: 2px solid #dedede;
  border-bottom: none;
  border-right: none;
  border-radius: 0.25rem 0 0 0;

  &:focus {
    outline: none;
  }
`;

const StyledState = styled.div`
  --color-shadow: rgba(0, 0, 0, 0.05);
  display: inline-block;
  border-radius: 0.25rem;
  text-align: left;
  border: 2px solid var(--color-border);
  margin: 0.5rem 1rem;
  flex-grow: 0;
  flex-shrink: 1;
  box-shadow: 0 0.5rem 1rem var(--color-shadow);
  background: white;
  color: #313131;

  &:not([data-type~="machine"]) {
    // opacity: 0.75;
  }

  & > .children {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    min-height: 1rem;
  }

  &:not([data-open="true"]) > .children > *:not(${StyledChildStatesToggle}) {
    display: none;
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
  }

  &[data-preview]:not([data-active]) {
    border-color: var(--color-primary-faded);
  }

  &[data-type~="parallel"] > .children > *:not(${StyledChildStatesToggle}) {
    border-style: dashed;
  }

  > header {
    padding: 0.5rem;

    &[data-type-symbol="final" i] {
      --symbol-color: red;
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

  &:not(:disabled):hover {
    background-color: var(--color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    background: var(--color-disabled);
  }

  &:focus {
    outline: none;
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

const StyledStateNodeHeader = styled.header`
  z-index: 1;
`;

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
        data-id={stateNode.id}
        data-type={dataType}
        data-active={isActive && stateNode.parent}
        data-preview={isPreview && stateNode.parent}
        // data-open={this.props.toggled || undefined}
        data-open={true}
      >
        <StyledStateNodeHeader
          style={{
            // @ts-ignore
            "--depth": stateNode.path.length
          }}
          data-type-symbol={
            ["history", "final", "parallel"].includes(stateNode.type)
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
            console.log(friendlyEventName(ownEvent));

            const disabled: boolean =
              current.nextEvents.indexOf(ownEvent) === -1 ||
              (!!transition.cond &&
                typeof transition.cond === "function" &&
                !transition.cond(current.context, ownEvent, {}));
            return (
              <StyledEvent>
                <StyledEventButton
                  onClick={() => onEvent(ownEvent)}
                  onMouseOver={() => onPreEvent(ownEvent)}
                  onMouseOut={() => onExitPreEvent()}
                  disabled={disabled}
                  data-id={`${stateNode.id}:${ownEvent}`}
                >
                  {friendlyEventName(ownEvent)}
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
