import React from "react";
import styled from "styled-components";
import { interpret, SimulatedClock, Interpreter } from "xstate/lib/interpreter";
import {
  Machine as _Machine,
  StateNode,
  State,
  EventObject,
  Machine
} from "xstate";
import * as XState from "xstate";
import { getEdges } from "xstate/lib/graph";
import { StateChartNode } from "./StateChartNode";

import { serializeEdge, isHidden, initialStateNodes } from "./utils";
import { Edge } from "./Edge";
import { tracker } from "./tracker";
import { Editor } from "./Editor";
import { InitialEdge } from "./InitialEdge";

const StyledViewTab = styled.li`
  padding: 0 1rem;
  border-bottom: 2px solid transparent;
  list-style: none;
  text-transform: uppercase;
  user-select: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;

  &:not([data-active]):hover {
    border-color: var(--color-secondary-light);
  }

  &[data-active] {
    border-color: var(--color-secondary);
  }
`;

const StyledViewTabs = styled.ul`
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;
  margin: 0;
  padding: 0;
  flex-grow: 0;
  flex-shrink: 0;
`;

const StyledSidebar = styled.div`
  background-color: var(--color-sidebar);
  color: white;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 2rem 1fr;
  border-radius: 0.5rem
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.2);
`;

const StyledView = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  overflow: hidden;
`;

const StyledStateChart = styled.div`
  display: grid;
  grid-template-columns: 1fr 20rem;
  grid-template-rows: auto;
  font-family: sans-serif;
  font-size: 10px;
  overflow: hidden;
  max-height: inherit;
  padding: 1rem;

  > * {
    max-height: inherit;
    overflow-y: scroll;
  }
`;

const StyledField = styled.div`
  padding: 0.5rem 1rem;
  width: 100%;
  overflow: hidden;

  > label {
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.5em;
    font-weight: bold;
  }
`;

const StyledPre = styled.pre`
  overflow: auto;
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

interface StateChartProps {
  machine: StateNode<any> | string;
  height?: number | string;
}

interface StateChartState {
  machine: StateNode<any>;
  current: State<any, any>;
  preview?: State<any, any>;
  previewEvent?: string;
  view: string; //"definition" | "state";
  code: string;
  toggledStates: Record<string, boolean>;
  service: Interpreter<any>;
  error?: any;
}

function toMachine(machine: StateNode<any> | string): StateNode<any> {
  if (typeof machine !== "string") {
    return machine;
  }

  let createMachine: Function;

  try {
    createMachine = new Function("Machine", "interpret", "XState", machine);
  } catch (e) {
    throw e;
  }

  let resultMachine: StateNode<any>;

  const machineProxy = (config: any, options: any, ctx: any) => {
    resultMachine = Machine(config, options, ctx);

    console.log(resultMachine);

    return resultMachine;
  };

  createMachine(machineProxy, interpret, XState);

  return resultMachine! as StateNode<any>;
}

const StyledVisualization = styled.div`
  max-height: inherit;
  overflow-y: scroll;
`;

const StyledStateViewActions = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const StyledStateViewAction = styled.li`
  white-space: nowrap;
  overflow-x: auto;
`;

export class StateChart extends React.Component<
  StateChartProps,
  StateChartState
> {
  state: StateChartState = (() => {
    const machine = toMachine(this.props.machine);
    // const machine = this.props.machine;

    return {
      current: machine.initialState,
      preview: undefined,
      previewEvent: undefined,
      view: "definition", // or 'state'
      machine: machine,
      code:
        typeof this.props.machine === "string"
          ? this.props.machine
          : `Machine(${JSON.stringify(machine.config, null, 2)})`,
      toggledStates: {},
      service: interpret(machine, {}).onTransition(current => {
        this.setState({ current }, () => {
          if (this.state.previewEvent) {
            this.setState({
              preview: this.state.service.nextState(this.state.previewEvent)
            });
          }
        });
      })
    };
  })();
  svgRef = React.createRef<SVGSVGElement>();
  componentDidMount() {
    this.state.service.start();
  }
  renderView() {
    const { view, current, machine, code } = this.state;

    switch (view) {
      case "definition":
        return (
          <Editor
            code={this.state.code}
            onChange={code => this.updateMachine(code)}
          />
        );
      case "state":
        return (
          <>
            <div style={{ overflowY: "auto" }}>
              <Field label="Value">
                <StyledPre>{JSON.stringify(current.value, null, 2)}</StyledPre>
              </Field>
              <Field label="Context" disabled={!current.context}>
                {current.context !== undefined ? (
                  <StyledPre>
                    {JSON.stringify(current.context, null, 2)}
                  </StyledPre>
                ) : null}
              </Field>
              <Field label="Actions" disabled={!current.actions.length}>
                {!!current.actions.length && (
                  <StyledPre>
                    {JSON.stringify(current.actions, null, 2)}
                  </StyledPre>
                )}
              </Field>
            </div>
            <Field
              label="Event"
              style={{
                marginTop: "auto",
                borderTop: "1px solid #777",
                flexShrink: 0,
                background: "var(--color-sidebar)"
              }}
            >
              <Editor
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
                      "Unable to send event.\nCheck the console for more info."
                    );
                  }
                }}
              />
            </Field>
          </>
        );
      default:
        return null;
    }
  }
  updateMachine(code: string) {
    let machine: StateNode;

    try {
      machine = toMachine(code);
    } catch (e) {
      console.error(e);
      alert(
        "Error: unable to update the machine.\nCheck the console for more info."
      );
      return;
    }

    this.state.service.stop();
    this.setState(
      {
        code,
        machine,
        current: machine.initialState
      },
      () => {
        this.setState(
          {
            service: interpret(this.state.machine)
              .onTransition(current => {
                this.setState({ current }, () => {
                  if (this.state.previewEvent) {
                    this.setState({
                      preview: this.state.service.nextState(
                        this.state.previewEvent
                      )
                    });
                  }
                });
              })
              .start()
          },
          () => {
            console.log(this.state.service);
          }
        );
      }
    );
  }
  render() {
    const { current, preview, previewEvent, machine, code } = this.state;

    const edges = getEdges(machine);

    const stateNodes = machine.getStateNodes(current);
    const events = new Set();

    stateNodes.forEach(stateNode => {
      const potentialEvents = Object.keys(stateNode.on);

      potentialEvents.forEach(event => {
        const transitions = stateNode.on[event];

        transitions.forEach(transition => {
          if (transition.target !== undefined) {
            events.add(event);
          }
        });
      });
    });

    return (
      <StyledStateChart
        key={code}
        style={{
          height: this.props.height || "100%",
          background: "var(--color-app-background)",
          // @ts-ignore
          "--color-app-background": "#FFF",
          "--color-border": "#dedede",
          "--color-primary": "rgba(87, 176, 234, 1)",
          "--color-primary-faded": "rgba(87, 176, 234, 0.5)",
          "--color-primary-shadow": "rgba(87, 176, 234, 0.1)",
          "--color-link": "rgba(87, 176, 234, 1)",
          "--color-disabled": "#c7c5c5",
          "--color-edge": "rgba(0, 0, 0, 0.2)",
          "--color-secondary": "rgba(255,152,0,1)",
          "--color-secondary-light": "rgba(255,152,0,.5)",
          "--color-sidebar": "#272722",
          "--radius": "0.2rem",
          "--border-width": "2px"
        }}
      >
        <StyledVisualization>
          <StateChartNode
            stateNode={this.state.machine}
            current={current}
            preview={preview}
            onEvent={this.state.service.send.bind(this)}
            onPreEvent={event =>
              this.setState({
                preview: this.state.service.nextState(event),
                previewEvent: event
              })
            }
            onExitPreEvent={() =>
              this.setState({ preview: undefined, previewEvent: undefined })
            }
            toggledStates={this.state.toggledStates}
          />
          <svg
            width="100%"
            height="100%"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              // @ts-ignore
              "--color": "gray",
              overflow: "visible",
              pointerEvents: "none"
            }}
            ref={this.svgRef}
            key={JSON.stringify(this.state.toggledStates)}
          >
            <defs>
              <marker
                id="marker"
                markerWidth="4"
                markerHeight="4"
                refX="2"
                refY="2"
                markerUnits="strokeWidth"
                orient="auto"
              >
                <path d="M0,0 L0,4 L4,2 z" fill="var(--color-edge)" />
              </marker>
              <marker
                id="marker-preview"
                markerWidth="4"
                markerHeight="4"
                refX="2"
                refY="2"
                markerUnits="strokeWidth"
                orient="auto"
              >
                <path d="M0,0 L0,4 L4,2 z" fill="gray" />
              </marker>
            </defs>
            {edges.map(edge => {
              if (!this.svgRef.current) {
                return;
              }

              // const svgRect = this.svgRef.current.getBoundingClientRect();

              return (
                <Edge
                  key={serializeEdge(edge)}
                  svg={this.svgRef.current}
                  edge={edge}
                  preview={
                    edge.event === previewEvent &&
                    current.matches(edge.source.path.join(".")) &&
                    !!preview &&
                    preview.matches(edge.target.path.join("."))
                  }
                />
              );
            })}
            {initialStateNodes(machine).map(initialStateNode => {
              if (!this.svgRef.current) {
                return;
              }

              // const svgRect = this.svgRef.current.getBoundingClientRect();

              return (
                <InitialEdge
                  key={initialStateNode.id}
                  source={initialStateNode}
                  svgRef={this.svgRef.current}
                  preview={
                    current.matches(initialStateNode.path.join(".")) ||
                    (!!preview &&
                      preview.matches(initialStateNode.path.join(".")))
                  }
                />
              );
            })}
          </svg>
        </StyledVisualization>
        <StyledSidebar>
          <StyledViewTabs>
            {["definition", "state"].map(view => {
              return (
                <StyledViewTab
                  onClick={() => this.setState({ view })}
                  key={view}
                  data-active={this.state.view === view || undefined}
                >
                  {view}
                </StyledViewTab>
              );
            })}
          </StyledViewTabs>
          <StyledView>{this.renderView()}</StyledView>
        </StyledSidebar>
      </StyledStateChart>
    );
  }
}
