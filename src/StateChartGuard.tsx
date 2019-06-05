import React from 'react';
import { Guard, State } from 'xstate';

export const StateChartGuard: React.SFC<{
  guard: Guard<any, any>;
  state: State<any>;
}> = ({ guard, state }) => {
  const valid = guard.predicate
    ? guard.predicate(state.context, state.event, { cond: guard })
    : undefined;

  return (
    <span
      style={{ color: valid === undefined ? 'gray' : valid ? 'green' : 'red' }}
    >
      {guard.type === 'xstate.guard' ? (guard as any).name : guard.type}
    </span>
  );
};
