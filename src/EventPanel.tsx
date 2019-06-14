import React from 'react';
import { EventObject } from 'xstate';

export const EventPanel: React.FunctionComponent<{
  events: EventObject[];
}> = ({ events }) => {
  return (
    <ul>
      {events.map((event, i) => {
        return (
          <li key={i}>
            <pre>{JSON.stringify(event, null, 2)}</pre>
          </li>
        );
      })}
    </ul>
  );
};
