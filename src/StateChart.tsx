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
import { serializeEdge, isHidden } from "./utils";

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
  padding: 1rem;

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
          background: "#F3F5F9",
          // @ts-ignore
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
              const sEdge = serializeEdge(edge);

              const elEvent = document.querySelector(`[data-id="${sEdge}"]`);
              const elSource = document.querySelector(
                `[data-id="${edge.source.id}"]`
              );
              let target = edge.target;
              let elTarget = document.querySelector(`[data-id="${target.id}"]`);

              while (isHidden(elTarget)) {
                if (!target.parent) {
                  break;
                }
                target = target.parent;
                elTarget = document.querySelector(`[data-id="${target.id}"]`);
                console.log(target.id, elTarget);
              }

              if (
                isHidden(elEvent) ||
                isHidden(elSource) ||
                isHidden(elTarget)
              ) {
                return;
              }

              const strokeWidth = 2;

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
                x: eventRect.right - 4,
                y: eventCenterPt.y
              };

              const end = {
                x: 0,
                y: 0
              };

              let m =
                (targetCenterPt.y - eventCenterPt.y) /
                (targetCenterPt.x - eventCenterPt.x);
              let b = eventCenterPt.y - m * eventCenterPt.x;
              let endSide: "left" | "top" | "bottom";
              const bezierPad = 10;

              if (eventCenterPt.x <= targetCenterPt.x) {
                if (m * targetRect.left + b < targetRect.top) {
                  end.y = targetRect.top;
                  end.x = (end.y - b) / m;
                  endSide = "top";
                } else if (m * targetRect.left + b > targetRect.bottom) {
                  end.y = targetRect.bottom;
                  end.x = (end.y - b) / m;
                  endSide = "bottom";
                } else {
                  end.x = targetRect.left;
                  end.y = m * end.x + b;
                  endSide = "left";
                }
              } else {
                if (m * targetRect.right + b < targetRect.top) {
                  end.y = targetRect.top;
                  end.x = (end.y - b) / m;
                  endSide = "top";
                } else if (m * targetRect.right + b > targetRect.bottom) {
                  end.y = targetRect.bottom;
                  end.x = (end.y - b) / m;
                  endSide = "bottom";
                } else {
                  end.x = targetRect.right - bezierPad;
                  if (eventCenterPt.y > targetCenterPt.y) {
                    end.y = targetRect.bottom;
                    endSide = "bottom";
                  } else {
                    end.y = targetRect.top;
                    endSide = "top";
                  }
                }
              }

              switch (endSide) {
                case "bottom":
                  end.y += 4;
                  break;
                case "top":
                  end.y -= 4;
                  break;
                case "left":
                  end.x -= 4;
                  break;
              }

              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const preEnd = { ...end };
              const postStart = {
                x: start.x + bezierPad,
                y:
                  Math.abs(dy) > bezierPad
                    ? start.x > end.x
                      ? dy > 0
                        ? start.y + bezierPad
                        : start.y - bezierPad
                      : start.y + bezierPad
                    : start.y
              };
              const points: Point[] = [start, postStart];

              const midpoints: Point[] = [];

              midpoints.push({
                x: start.x + bezierPad,
                y: start.y + dy / 2
              });

              if (endSide === "top") {
                preEnd.y = preEnd.y - bezierPad;
                midpoints.push({
                  x: preEnd.x,
                  y: preEnd.y - dy / 2
                });
              } else if (endSide === "bottom") {
                preEnd.y = preEnd.y + bezierPad;
                midpoints.push({
                  x: preEnd.x,
                  y: preEnd.y + dy / 2
                });
              } else if (endSide === "left") {
                preEnd.y = end.y;
                preEnd.x = end.x - bezierPad;
                midpoints.push({
                  x: preEnd.x - dx / 2,
                  y: preEnd.y
                });
              }

              points.push(preEnd);
              points.push(end);

              const path = points.reduce((acc, point, i) => {
                if (i === 0) {
                  return `M ${point.x},${point.y}`;
                }

                if (i === points.length - 1) {
                  return acc + ` L ${point.x},${point.y}`;
                }

                const prevPoint = points[i - 1];
                const nextPoint = points[i + 1];

                if (prevPoint.x === point.x || prevPoint.y === point.y) {
                  return acc + ` L ${point.x},${point.y}`;
                }

                // return acc + ` L ${point.x},${point.y}`;

                const dx = point.x - prevPoint.x;
                const dy = point.y - prevPoint.y;
                const nextDx = nextPoint.x - point.x;
                const nextDy = nextPoint.y - point.y;

                const midpoint1 = {
                  x: prevPoint.x + dx / 2,
                  y: prevPoint.y + dy / 2
                };
                const midpoint2 = {
                  x: point.x + nextDx / 2,
                  y: point.y + nextDy / 2
                };

                return (
                  acc + ` Q ${point.x},${point.y} ${midpoint2.x},${midpoint2.y}`
                );
              }, "");

              const pathMidpoints = midpoints
                .map(midpoint => {
                  return `${midpoint.x} ${midpoint.y}`;
                })
                .join(", ");

              const isHighlighted =
                edge.event === previewEvent &&
                current.matches(edge.source.path.join(".")) &&
                preview &&
                preview.matches(edge.target.path.join("."));

              return (
                <path
                  key={
                    serializeEdge(edge) +
                    JSON.stringify(this.state.toggledStates)
                  }
                  data-d={`M${start.x} ${start.y} C ${pathMidpoints}, ${
                    preEnd.x
                  } ${preEnd.y} L ${end.x} ${end.y}`}
                  d={path}
                  stroke={isHighlighted ? "gray" : "var(--color-edge)"}
                  strokeWidth={strokeWidth}
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
