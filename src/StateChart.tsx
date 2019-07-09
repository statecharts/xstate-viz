import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Machine as _Machine,
  StateNode,
  State,
  EventObject,
  Machine,
  assign,
  send,
  spawn,
  interpret,
  Interpreter,
  StateMachine
} from 'xstate';
import * as XState from 'xstate';
import { Editor } from './Editor';
import { StateChartContainer, StyledVizTabsTabs } from './VizTabs';
import { StatePanel } from './StatePanel';
import { EventPanel } from './EventPanel';
import { CodePanel } from './CodePanel';
import { raise } from 'xstate/lib/actions';

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
  position: sticky;
  top: 0;
`;

const StyledSidebar = styled.div`
  background-color: var(--color-sidebar);
  color: white;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 2rem 1fr;
  border-top-left-radius: 1rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
`;

const StyledView = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  // overflow: hidden;
`;

export const StyledStateChart = styled.div`
  grid-area: content;
  display: grid;
  grid-template-columns: 1fr var(--sidebar-width, 25rem);
  grid-template-rows: 1fr;
  grid-column-gap: 1rem;
  font-family: sans-serif;
  font-size: 12px;
  overflow: hidden;
  max-height: inherit;

  > ${StyledSidebar} {
    grid-column: 2 / 3;
    grid-row: 1 / -1;
  }

  > ${StyledViewTabs} {
    grid-column: 1 / 2;
    grid-row: 1 / -1;
  }

  > * {
    max-height: inherit;
    overflow-y: auto;
  }
`;

interface StateChartProps {
  className?: string;
  machine: StateNode<any> | string;
  onSave: (machineString: string) => void;
  height?: number | string;
}

export interface EventRecord {
  event: EventObject;
  time: number;
}
export interface StateChartState {
  machine: StateNode<any>;
  current: State<any, any>;
  preview?: State<any, any>;
  previewEvent?: string;
  view: string; //"definition" | "state";
  code: string;
  toggledStates: Record<string, boolean>;
  service: Interpreter<any>;
  error?: any;
  events: Array<EventRecord>;
}

export function toMachine(machine: StateNode<any> | string): StateNode<any> {
  if (typeof machine !== 'string') {
    return machine;
  }

  let createMachine: Function;
  // export {
  //   Machine,
  //   StateNode,
  //   State,
  //   matchesState,
  //   mapState,
  //   actions,
  //   assign,
  //   send,
  //   sendParent,
  //   interpret,
  //   Interpreter,
  //   matchState,
  //   spawn
  // };
  try {
    createMachine = new Function(
      'Machine',
      'interpret',
      'assign',
      'send',
      'sendParent',
      'spawn',
      'raise',
      'actions',
      'XState',
      machine
    );
  } catch (e) {
    throw e;
  }

  const machines: Array<StateNode<any>> = [];

  const machineProxy = (config: any, options: any) => {
    const machine = Machine(config, options);
    machines.push(machine);
    return machine;
  };

  createMachine(
    machineProxy,
    interpret,
    assign,
    send,
    XState.sendParent,
    spawn,
    raise,
    XState.actions,
    XState
  );

  return machines[machines.length - 1]! as StateNode<any>;
}

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
      view: 'definition', // or 'state'
      machine: machine,
      code:
        typeof this.props.machine === 'string'
          ? this.props.machine
          : `Machine(${JSON.stringify(machine.config, null, 2)})`,
      toggledStates: {},
      service: interpret(machine, {}).onTransition(current => {
        this.handleTransition(current);
      }),
      events: []
    };
  })();
  handleTransition(state: State<any>): void {
    const formattedEvent = {
      event: state.event,
      time: Date.now()
    };
    this.setState(
      { current: state, events: this.state.events.concat(formattedEvent) },
      () => {
        if (this.state.previewEvent) {
          // this.setState({
          //   preview: this.state.service.nextState(this.state.previewEvent)
          // });
        }
      }
    );
  }
  svgRef = React.createRef<SVGSVGElement>();
  componentDidMount() {
    this.state.service.start();
  }
  componentDidUpdate(prevProps: StateChartProps) {
    const { machine } = this.props;

    if (machine !== prevProps.machine) {
      this.updateMachine(machine.toString());
    }
  }
  renderView() {
    const { view, current, machine, code, service, events } = this.state;
    const { onSave } = this.props;

    switch (view) {
      case 'definition':
        return (
          <CodePanel
            code={code}
            onChange={code => this.updateMachine(code)}
            onSave={onSave}
          />
        );
      case 'state':
        return <StatePanel state={current} service={service} />;
      case 'events':
        return (
          <EventPanel state={current} service={service} records={events} />
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
        events: [],
        current: machine.initialState
      },
      () => {
        this.setState(
          {
            service: interpret(this.state.machine)
              .onTransition(current => {
                this.handleTransition(current);
                // TODO: fix events
                // this.setState({ current, events: [] }, () => {
                //   if (this.state.previewEvent) {
                //     this.setState({
                //       preview: this.state.service.nextState(
                //         this.state.previewEvent
                //       )
                //     });
                //   }
                // });
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
    const { code, service } = this.state;

    return (
      <StyledStateChart
        className={this.props.className}
        key={code}
        style={{
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
          '--color-edge-active': 'var(--color-primary)',
          '--color-secondary': 'rgba(255,152,0,1)',
          '--color-secondary-light': 'rgba(255,152,0,.5)',
          '--color-sidebar': '#272722',
          '--radius': '0.2rem',
          '--border-width': '2px'
        }}
      >
        <StateChartContainer service={service} onReset={() => this.reset()} />
        <StyledSidebar>
          <StyledViewTabs>
            {['definition', 'state', 'events'].map(view => {
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
          {this.renderView()}
        </StyledSidebar>
      </StyledStateChart>
    );
  }
}
