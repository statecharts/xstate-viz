import React from 'react';
import { Guard, State } from 'xstate';
import styled from 'styled-components';

const StyledSCGuard = styled.div`
  padding: 0 0.5rem;
`;

export const StateChartGuard: React.SFC<{
  guard: Guard<any, any>;
  state: State<any>;
}> = ({ guard, state }) => {
  const valid = guard.predicate
    ? guard.predicate(state.context, state.event, { cond: guard })
    : undefined;

  return (
    <StyledSCGuard
      style={{ color: valid === undefined ? 'gray' : valid ? 'green' : 'red' }}
    >
      {guard.type === 'xstate.guard' ? (guard as any).name : guard.type}
    </StyledSCGuard>
  );
};
