import React, { useState, useEffect, useMemo } from 'react';
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
import { getEdges } from 'xstate/lib/graph';
import { notificationsActor } from './Header';
import { useMachine, useService } from '@xstate/react';

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
  font-family: sans-serif;
  font-size: 12px;
  overflow: hidden;
  max-height: inherit;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

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

  try {
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
  } catch (e) {
    throw e;
  }

  return machines[machines.length - 1]! as StateNode<any>;
}

export const StateChart: React.FC<StateChartProps> = ({
  onSave,
  className,
  ...props
}) => {
  const [resetCount, setResetCount] = useState(0);
  const [events, setEvents] = useState<EventRecord[]>([]);

  const machine = useMemo(() => {
    return toMachine(props.machine);
  }, [props.machine]);
  const service = useMemo(() => {
    return interpret(machine).start();
  }, [machine, resetCount]);

  const [current] = useService(service);

  useEffect(() => {
    const formattedEvent = {
      event: current.event,
      time: Date.now()
    };

    setEvents(events.concat(formattedEvent));
  }, [current]);

  const [allState, setState] = useState<StateChartState>(
    (() => {
      const _machine = toMachine(props.machine);

      return {
        current: _machine.initialState,
        preview: undefined,
        previewEvent: undefined,
        view: 'definition', // or 'state'
        machine: _machine,
        code:
          typeof _machine === 'string'
            ? _machine
            : `Machine(${JSON.stringify(_machine.config, null, 2)})`,
        toggledStates: {},
        service: interpret(_machine),
        events: []
      };
    })()
  );

  function renderView() {
    const { view, current, code, service } = allState;

    switch (view) {
      case 'definition':
        return (
          <CodePanel
            code={code}
            onChange={code => updateMachine(code)}
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

  function updateMachine(code: string) {
    let machine: StateNode;

    try {
      machine = toMachine(code);
      getEdges(machine);
    } catch (e) {
      notificationsActor.notify({
        message: 'Failed to update machine',
        severity: 'error',
        description: e.message
      });
      console.error(e);
      return;
    }

    reset(code, machine);
  }
  function reset(code = allState.code, machine = allState.machine) {
    setEvents([]);
    setResetCount(resetCount + 1);
  }

  const { code } = allState;

  return (
    <StyledStateChart
      className={className}
      key={code}
      style={{
        background: 'var(--color-app-background)'
      }}
    >
      <StateChartContainer service={service} onReset={() => reset()} />
      <StyledSidebar>
        <StyledViewTabs>
          {['definition', 'state', 'events'].map(view => {
            return (
              <StyledViewTab
                onClick={() => setState({ ...allState, view })}
                key={view}
                data-active={allState.view === view || undefined}
              >
                {view}
              </StyledViewTab>
            );
          })}
        </StyledViewTabs>
        {renderView()}
      </StyledSidebar>
    </StyledStateChart>
  );
};
