import React from 'react';
import { ActionObject, Guard, State, SendActionObject } from 'xstate';
import { actionTypes } from 'xstate/lib/actions';
import styled from 'styled-components';

interface StateChartActionProps {
  action: ActionObject<any, any>;
}

// {typeof action.assignment === 'function' ? (
//   <div>
//     <strong>*</strong>: <code>{action.assignment.toString()}</code>
//   </div>
// ) : (
//   Object.keys(action.assignment).map(key => {
//     return (
//       <div key={key}>
//         <strong>{key}</strong>: {action.assignment[key].toString()}
//       </div>
//     );
//   })
// )}

const StyledStateChartAction = styled.li`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 20ch;
  padding: 0.25rem;
`;

export const StateChartAction: React.SFC<StateChartActionProps> = ({
  action
}) => {
  switch (action.type) {
    case actionTypes.assign:
      return typeof action.assignment === 'function' ? (
        <StyledStateChartAction>
          <strong>assign</strong>
        </StyledStateChartAction>
      ) : (
        <>
          {Object.keys(action.assignment).map(key => {
            return (
              <StyledStateChartAction key={key} title={`assign ${key}`}>
                <strong>assign</strong> {key}
              </StyledStateChartAction>
            );
          })}
        </>
      );

    case actionTypes.send:
      const sendAction = action as SendActionObject<any, any>;

      if (sendAction.type.indexOf('xstate.') === 0) {
        return null;
      }

      return (
        <StyledStateChartAction>
          <strong>send</strong> {sendAction.event.type}{' '}
          {sendAction.to ? `to ${JSON.stringify(sendAction.to)}` : ''}
        </StyledStateChartAction>
      );

    default:
      if (action.type.indexOf('xstate.') === 0) {
        return null;
      }
      return <div>{action.type}</div>;
  }
};

export const StateChartGuard: React.SFC<{
  guard: Guard<any, any>;
  state: State<any>;
}> = ({ guard, state }) => {
  const valid = guard.predicate
    ? guard.predicate(state.context, state.event, { cond: guard })
    : undefined;

  return (
    <div
      style={{ color: valid === undefined ? 'gray' : valid ? 'green' : 'red' }}
    >
      {guard.type === 'xstate.guard' ? guard.name : guard.type}
    </div>
  );
};
