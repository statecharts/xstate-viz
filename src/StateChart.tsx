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
    border-color: rgba(255, 152, 0, 0.5);
  }

  &[data-active] {
    border-color: rgba(255, 152, 0, 1);
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
  background-color: #272722;
  color: white;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 2rem 1fr;
`;

const StyledView = styled.div``;

const StyledStateChart = styled.div`
  display: grid;
  grid-template-columns: 1fr 30rem;
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

  > label {
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.5em;
    font-weight: bold;
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
}

function toMachine(machine: StateNode<any> | string): StateNode<any> {
  if (typeof machine !== "string") {
    return machine;
  }

  const createMachine = new Function("Machine", "interpret", "XState", machine);

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
      service: interpret(machine, {
        clock: new SimulatedClock()
      }).onTransition(current => {
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
            <Field label="Value">
              <pre>{JSON.stringify(current.value, null, 2)}</pre>
            </Field>
            <Field label="Actions">
              {current.actions.length ? (
                <ul>
                  {current.actions.map(action => {
                    return <li key={action.type}>{action.type}</li>;
                  })}
                </ul>
              ) : (
                "-"
              )}
            </Field>
            <Field label="Context" disabled={!current.context}>
              {current.context !== undefined ? (
                <pre>{JSON.stringify(current.context, null, 2)}</pre>
              ) : null}
            </Field>
            <Field label="Event" style={{ height: "5rem" }}>
              <Editor
                code={'{type: ""}'}
                onChange={code => {
                  try {
                    const eventData = eval(`(${code})`);

                    this.state.service.send(eventData);
                  } catch (e) {
                    alert(e);
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
  toggleState(id: string) {
    this.setState(
      {
        toggledStates: {
          ...this.state.toggledStates,
          [id]: !this.state.toggledStates[id]
        }
      },
      () => {
        tracker.updateAll();
      }
    );
  }
  updateMachine(code: string) {
    const machine = toMachine(code);

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
          "--color-app-background": "#F3F5F9",
          "--color-border": "#dedede",
          "--color-primary": "rgba(87, 176, 234, 1)",
          "--color-primary-faded": "rgba(87, 176, 234, 0.5)",
          "--color-primary-shadow": "rgba(87, 176, 234, 0.1)",
          "--color-link": "rgba(87, 176, 234, 1)",
          "--color-disabled": "#888",
          "--color-edge": "rgba(0, 0, 0, 0.2)",
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
            onToggle={id => this.toggleState(id)}
            onExitPreEvent={() =>
              this.setState({ preview: undefined, previewEvent: undefined })
            }
            toggledStates={this.state.toggledStates}
            toggled={true}
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

              const svgRect = this.svgRef.current.getBoundingClientRect();

              return (
                <Edge
                  key={serializeEdge(edge)}
                  svg={svgRect}
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

              const svgRect = this.svgRef.current.getBoundingClientRect();

              return (
                <InitialEdge
                  key={initialStateNode.id}
                  source={initialStateNode}
                  svgRect={svgRect}
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
          <footer />
        </StyledSidebar>
      </StyledStateChart>
    );
  }
}
