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
import { StateChartContainer, StyledStateChartContainer } from './VizTabs';
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
  box-shadow: var(--shadow);
  transition: transform 0.6s cubic-bezier(0.5, 0, 0.5, 1);
  z-index: 1;
`;

export const StyledStateChart = styled.div`
  grid-area: content;
  display: grid;
  grid-template-columns: 1fr var(--sidebar-width, 25rem);
  grid-template-rows: 1fr;
  grid-template-areas: 'content sidebar';
  grid-column-gap: 1rem;
  font-family: sans-serif;
  font-size: 12px;
  overflow: hidden;
  max-height: inherit;

  > ${StyledSidebar} {
    grid-area: sidebar;
  }

  > ${StyledStateChartContainer} {
    grid-area: content;
  }

  > * {
    max-height: inherit;
    overflow-y: auto;
  }

  [data-layout='viz'] & {
    > :not(${StyledSidebar}) {
      grid-column: 1 / -1;
    }

    > ${StyledSidebar} {
      transform: translateX(100%);
    }
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

export class StateChart extends React.Component<
  StateChartProps,
  StateChartState
> {
  state: StateChartState = (() => {
    const machine = toMachine(this.props.machine);

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
    const { className } = this.props;
    const { code, service } = this.state;

    return (
      <StyledStateChart
        className={className}
        key={code}
        style={{
          background: 'var(--color-app-background)'
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
