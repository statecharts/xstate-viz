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
import { VizTabs, StyledVizTabsTabs } from './VizTabs';

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

export const StyledStateChart = styled.div`
  display: grid;
  grid-template-columns: 1fr 25rem;
  grid-template-rows: 1fr;
  grid-column-gap: 1rem;
  font-family: sans-serif;
  font-size: 12px;
  overflow: hidden;
  max-height: inherit;
  padding: 1rem;

  > ${StyledVizTabsTabs} {
    grid-column: 1 / 2;
    grid-row: 1 / -1;
  }

  > ${StyledSidebar} {
    grid-column: 2 / 3;
    grid-row: 1 / -1;
  }

  > * {
    max-height: inherit;
    overflow-y: auto;
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
  className?: string;
  machine: StateNode<any> | string;
  height?: number | string;
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
  selectedService?: Interpreter<any>;
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
      'XState',
      machine
    );
  } catch (e) {
    throw e;
  }

  let resultMachine: StateNode<any>;

  const machineProxy = (config: any, options: any, ctx: any) => {
    if (resultMachine) {
      console.log('already', config);
      return Machine(config, options);
    }
    resultMachine = Machine(config, options);

    return resultMachine;
  };

  createMachine(
    machineProxy,
    interpret,
    assign,
    send,
    XState.sendParent,
    spawn,
    XState
  );

  return resultMachine! as StateNode<any>;
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
        this.setState({ current }, () => {
          if (this.state.previewEvent) {
            // this.setState({
            //   preview: this.state.service.nextState(this.state.previewEvent)
            // });
          }
        });
      }),
      selectedService: undefined
    };
  })();
  svgRef = React.createRef<SVGSVGElement>();
  componentDidMount() {
    this.state.service.start();
  }
  setSelectedService(selectedService: Interpreter<any>) {
    this.setState({
      selectedService
    });
  }
  renderView() {
    const { view, current, machine, code, service } = this.state;

    switch (view) {
      case 'definition':
        return (
          <Editor
            code={this.state.code}
            onChange={code => this.updateMachine(code)}
          />
        );
      case 'state':
        return (
          <>
            <div style={{ overflowY: 'auto' }}>
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
                marginTop: 'auto',
                borderTop: '1px solid #777',
                flexShrink: 0,
                background: 'var(--color-sidebar)'
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
                      'Unable to send event.\nCheck the console for more info.'
                    );
                  }
                }}
              />
            </Field>
          </>
        );
      case 'children':
        const foo = (parentService: Interpreter<any, any>) => {
          return (
            <div
              key={parentService.id}
              style={{ paddingLeft: '1rem' }}
              onClick={e => {
                e.stopPropagation();
                this.setSelectedService(parentService);
              }}
            >
              <strong>{parentService.id}</strong>
              {Array.from<Interpreter<any, any>>(
                (parentService as any).children.values()
              ).map(childService => {
                return foo(childService);
              })}
            </div>
          );
        };

        return foo(service);
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
          '--color-secondary': 'rgba(255,152,0,1)',
          '--color-secondary-light': 'rgba(255,152,0,.5)',
          '--color-sidebar': '#272722',
          '--radius': '0.2rem',
          '--border-width': '2px'
        }}
      >
        <VizTabs
          service={service}
          selectedService={this.state.selectedService}
          onSelectService={s => this.setSelectedService(s)}
        />
        <StyledSidebar>
          <StyledViewTabs>
            {['definition', 'state', 'children'].map(view => {
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
