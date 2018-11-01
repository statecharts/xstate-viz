import React from "react";
import styled from "styled-components";
import { interpret } from "xstate/lib/interpreter";
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
import AceEditor from "react-ace";
import "brace/theme/monokai";
import "brace/mode/javascript";

const StyledViewTabs = styled.ul`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: flex-start;
  align-items: stretch;
  margin: 0;
  padding: 0;
  height: 1rem;

  > li {
    padding: 0 0.5rem;
    text-align: center;
    list-style: none;
  }
`;

const StyledStateChart = styled.div`
  display: grid;
  grid-template-columns: 1fr 30rem;
  grid-template-rows: auto;
  font-family: sans-serif;
  font-size: 10px;
  overflow: hidden;
  max-height: inherit;

  > * {
    max-height: inherit;
    overflow-y: scroll;
  }
`;

const StyledField = styled.div`
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
}
function Field({ label, children }: FieldProps) {
  return (
    <StyledField>
      <label>{label}</label>
      {children}
    </StyledField>
  );
}

interface Point {
  x: number;
  y: number;
}

function center(rect: ClientRect): Point {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
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
}

function toMachine(machine: StateNode<any> | string): StateNode<any> {
  if (typeof machine !== "string") {
    return machine;
  }

  const createMachine = new Function("Machine", "interpret", "XState", machine);

  let resultMachine: StateNode<any>;

  const machineProxy = (config: any, options: any) => {
    resultMachine = Machine(config, options);

    return resultMachine;
  };

  createMachine(machineProxy, interpret, XState);

  return resultMachine! as StateNode<any>;
}

function relative(childRect: ClientRect, parentRect: ClientRect): ClientRect {
  return {
    top: childRect.top - parentRect.top,
    right: childRect.right - parentRect.left,
    bottom: childRect.bottom - parentRect.top,
    left: childRect.left - parentRect.left,
    width: childRect.width,
    height: childRect.height
  };
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
          : `Machine(${JSON.stringify(machine.definition, null, 2)})`,
      toggledStates: {}
    };
  })();
  service = interpret(this.state.machine).onTransition(current => {
    this.setState({ current }, () => {
      if (this.state.previewEvent) {
        this.setState({
          preview: this.service.nextState(this.state.previewEvent)
        });
      }
    });
  });
  svgRef = React.createRef<SVGSVGElement>();
  componentDidMount() {
    this.service.start();
  }
  renderView() {
    const { view, current, machine, code } = this.state;

    switch (view) {
      case "definition":
        return (
          <AceEditor
            mode="javascript"
            theme="monokai"
            editorProps={{ $blockScrolling: true }}
            value={code}
            onChange={value => this.setState({ code: value })}
            setOptions={{ tabSize: 2 }}
            width="100%"
            height="100%"
          />
        );
      case "state":
        return (
          <div>
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
            <Field label="Context">
              {current.context !== undefined ? (
                <pre>{JSON.stringify(current.context, null, 2)}</pre>
              ) : (
                "-"
              )}
            </Field>
          </div>
        );
      default:
        return null;
    }
  }
  toggleState(id: string) {
    this.setState({
      toggledStates: {
        ...this.state.toggledStates,
        [id]: !this.state.toggledStates[id]
      }
    });
  }
  updateMachine() {
    const { code } = this.state;

    const machine = toMachine(code);

    this.setState(
      {
        machine
      },
      () => {
        this.service.stop();
        this.service = interpret(this.state.machine)
          .onTransition(current => {
            this.setState({ current }, () => {
              if (this.state.previewEvent) {
                this.setState({
                  preview: this.service.nextState(this.state.previewEvent)
                });
              }
            });
          })
          .start();
      }
    );
  }
  render() {
    const { current, preview, previewEvent, machine } = this.state;

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
        style={{
          height: this.props.height || "100%",
          // @ts-ignore
          "--color-border": "#dedede",
          "--color-primary": "rgba(87, 176, 234, 1)",
          "--color-primary-faded": "rgba(87, 176, 234, 0.5)",
          "--color-primary-shadow": "rgba(87, 176, 234, 0.1)",
          "--color-link": "rgba(87, 176, 234, 1)",
          "--color-disabled": "#888",
          "--color-edge": "rgba(0, 0, 0, 0.2)",
          "--radius": "0.2rem"
        }}
      >
        <StyledVisualization>
          <StateChartNode
            stateNode={this.state.machine}
            current={current}
            preview={preview}
            onEvent={this.service.send.bind(this)}
            onPreEvent={event =>
              this.setState({
                preview: this.service.nextState(event),
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
                <path d="M0,0 L0,4 L4,2 z" fill="var(--color-primary)" />
              </marker>
            </defs>
            {edges.map(edge => {
              if (!this.svgRef.current) {
                return;
              }

              const elEvent = document.querySelector(
                `[data-id="${edge.source.id}:${edge.event}"]`
              );
              const elSource = document.querySelector(
                `[data-id="${edge.source.id}"]`
              );
              const elTarget = document.querySelector(
                `[data-id="${edge.target.id}"]`
              );

              if (!elEvent || !elTarget || !elSource) {
                return;
              }

              const sourceRect = relative(
                elSource.getBoundingClientRect(),
                this.svgRef.current.getBoundingClientRect()
              );
              const eventRect = relative(
                elEvent.getBoundingClientRect(),
                this.svgRef.current.getBoundingClientRect()
              );
              const targetRect = relative(
                elTarget.getBoundingClientRect(),
                this.svgRef.current.getBoundingClientRect()
              );
              const eventCenterPt = center(eventRect);
              const targetCenterPt = center(targetRect);

              const start = {
                x: eventRect.right - 5,
                y: eventCenterPt.y + 1
              };
              const midpoints: Point[] = [];
              const end = { x: targetRect.left - 4, y: targetRect.bottom };

              if (start.y > targetRect.top && start.y < targetRect.bottom) {
                end.y = start.y;
              }
              if (start.x > end.x) {
                start.x = eventRect.right - 8;
                start.y = eventCenterPt.y + 4;
                midpoints.push({
                  x: start.x,
                  y: sourceRect.bottom + 10
                });
                midpoints.push({
                  x: sourceRect.left,
                  y: sourceRect.bottom + 10
                });
                midpoints.push({
                  x: targetRect.right - 10,
                  y: targetRect.bottom + 10
                });
                end.x = targetRect.right - 10;
                end.y = targetRect.bottom + 4;
              }

              if (start.y < targetRect.top) {
                end.y = targetRect.top;
              }

              if (start.x <= targetRect.right && start.x >= targetRect.left) {
                end.x = start.x;
              }

              const pathMidpoints = midpoints
                .map(midpoint => {
                  return `L ${midpoint.x},${midpoint.y}`;
                })
                .join(" ");

              const isHighlighted =
                edge.event === previewEvent &&
                current.matches(edge.source.path.join(".")) &&
                preview &&
                preview.matches(edge.target.path.join("."));

              return (
                <path
                  d={`M${start.x} ${start.y - 1} ${pathMidpoints} ${end.x} ${
                    end.y
                  }`}
                  stroke={
                    isHighlighted ? "var(--color-primary)" : "var(--color-edge)"
                  }
                  strokeWidth={2}
                  fill="none"
                  markerEnd={
                    isHighlighted ? `url(#marker-preview)` : `url(#marker)`
                  }
                />
              );
            })}
          </svg>
        </StyledVisualization>
        <div
          style={{
            overflow: "scroll",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <StyledViewTabs>
            {["definition", "state"].map(view => {
              return (
                <li onClick={() => this.setState({ view })} key={view}>
                  {view}
                </li>
              );
            })}
          </StyledViewTabs>
          {this.renderView()}
          <footer>
            <button onClick={() => this.updateMachine()}>Update</button>
          </footer>
        </div>
      </StyledStateChart>
    );
  }
}
