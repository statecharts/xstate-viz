import { State, StateMachine, Interpreter, interpret } from 'xstate';
import React, { useState } from 'react';
import { StateChartContainer } from './VizTabs';
import { StyledStateChart, toMachine } from './StateChart';

interface SCMachineState {
  current: State<any>;
  preview?: State<any>;
  previewEvent?: string;
  machine: StateMachine<any, any, any>;
  service: Interpreter<any>;
}

export const SCMachine: React.SFC<{
  machine: StateMachine<any, any, any>;
}> = ({ machine: machineSrc }) => {
  const machine = toMachine(machineSrc);
  const [{ service }, setState] = useState<SCMachineState>({
    machine,
    current: machine.initialState,
    service: interpret(machine)
  });

  return (
    <StyledStateChart
      // className={this.props.className}
      key={machine.id}
      style={{
        // height: this.props.height || '100%',
        height: '100%',
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
      <StateChartContainer service={service} onReset={() => void 0} />
    </StyledStateChart>
  );
};
