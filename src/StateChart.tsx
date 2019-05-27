import React, { useState } from 'react';
import styled from 'styled-components';
import { interpret, Interpreter } from 'xstate/lib/interpreter';
import { Machine as _Machine, StateNode, State, Machine, assign } from 'xstate';
import * as XState from 'xstate';
import { getEdges } from 'xstate/lib/graph';
import { EditorRender } from './EditorRender';
import { Visualizer } from './Visualizer';

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
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
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
  grid-template-columns: ${(props: { isEditorShown: boolean }) =>
    props.isEditorShown ? `1fr 25rem` : `1fr`};
  grid-template-rows: auto;
  font-family: sans-serif;
  font-size: 12px;
  overflow: hidden;
  max-height: inherit;
  padding: 1rem;

  > * {
    max-height: inherit;
    overflow-y: auto;
  }
`;

interface StateChartProps {
  className?: string;
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
  isEditorShown: boolean;
}

function toMachine(machine: StateNode<any> | string): StateNode<any> {
  if (typeof machine !== 'string') {
    return machine;
  }

  let createMachine: Function;

  try {
    createMachine = new Function(
      'Machine',
      'interpret',
      'assign',
      'XState',
      machine
    );
  } catch (e) {
    throw e;
  }

  let resultMachine: StateNode<any>;

  const machineProxy = (config: any, options: any, ctx: any) => {
    resultMachine = Machine(config, options, ctx);

    console.log(resultMachine);

    return resultMachine;
  };

  createMachine(machineProxy, interpret, assign, XState);

  return resultMachine! as StateNode<any>;
}

const StyledVisualization = styled.div`
  position: relative;
  max-height: inherit;
  overflow-y: auto;
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
      view: 'definition', // or 'state'
      machine: machine,
      code:
        typeof this.props.machine === 'string'
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
      }),
      isEditorShown: false
    };
  })();

  componentDidMount() {
    this.state.service.start();
  }
  toggleEditor() {
    this.setState(prevState => ({
      ...prevState,
      isEditorShown: !prevState.isEditorShown
    }));
  }
  updateMachine(code: string) {
    let machine: StateNode;

    try {
      machine = toMachine(code);
    } catch (e) {
      console.error(e);
      alert(
        'Error: unable to update the machine.\nCheck the console for more info.'
      );
      return;
    }

    this.reset(code, machine);
  }
  reset(code = this.state.code, machine = this.state.machine) {
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
    const {
      current,
      preview,
      previewEvent,
      machine,
      code,
      view,
      service,
      toggledStates,
      isEditorShown
    } = this.state;

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
        className={this.props.className}
        key={code}
        isEditorShown={isEditorShown}
        style={{
          height: this.props.height || '100%',
          background: 'var(--color-app-background)',
          // @ts-ignore
          '--color-app-background': '#FFF',
          '--color-border': '#dedede',
          '--color-primary': 'rgba(87, 176, 234, 1)',
          '--color-primary-faded': 'rgba(87, 176, 234, 0.5)',
          '--color-primary-shadow': 'rgba(87, 176, 234, 0.1)',
          '--color-link': 'rgba(87, 176, 234, 1)',
          '--color-disabled': '#c7c5c5',
          '--color-edge': 'rgba(0, 0, 0, 0.2)',
          '--color-secondary': 'rgba(255,152,0,1)',
          '--color-secondary-light': 'rgba(255,152,0,.5)',
          '--color-sidebar': '#272722',
          '--radius': '0.2rem',
          '--border-width': '2px'
        }}
      >
        <StyledVisualization>
          <Visualizer
            machine={machine}
            current={current}
            preview={preview}
            previewEvent={previewEvent}
            onStateChartNodeReset={this.reset.bind(this)}
            onStateChartNodeEvent={service.send.bind(this)}
            onStateChartNodePreEvent={event =>
              this.setState({
                preview: service.nextState(event),
                previewEvent: event
              })
            }
            onStateChartNodeExitPreEvent={() =>
              this.setState({ preview: undefined, previewEvent: undefined })
            }
            toggledStates={toggledStates}
            toggleEditorPanel={this.toggleEditor.bind(this)}
            edges={edges}
          />
        </StyledVisualization>
        {isEditorShown ? (
          <StyledSidebar>
            <StyledViewTabs>
              {['definition', 'state'].map(mappedView => {
                return (
                  <StyledViewTab
                    onClick={() => this.setState({ view: mappedView })}
                    key={mappedView}
                    data-active={view === mappedView || undefined}
                  >
                    {mappedView}
                  </StyledViewTab>
                );
              })}
            </StyledViewTabs>
            <StyledView>
              <EditorRender
                view={view}
                current={current}
                code={code}
                onEditorChange={{
                  definition: code => {
                    this.updateMachine(code);
                  },
                  state: eventData => {
                    service.send(eventData);
                  }
                }}
              />
            </StyledView>
          </StyledSidebar>
        ) : null}
      </StyledStateChart>
    );
  }
}
