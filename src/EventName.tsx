import React from 'react';
import { DELAY_EVENT_REGEX } from './utils';

export const EventName: React.FunctionComponent<{
  event: string;
}> = ({ event }) => {
  let match = event.match(DELAY_EVENT_REGEX);
  if (match) {
    const isMs = Number.isFinite(+match[1]);
    return (
      <span>
        <em>after</em> {match[1]}
        {isMs ? 'ms' : ''}
      </span>
    );
  }
  match = event.match(/^done\.state/);
  if (match) {
    return (
      <span>
        <em>done</em>
      </span>
    );
  }
  match = event.match(/^done\.invoke\.(.+)/);
  if (match) {
    return (
      <span>
        <em>done</em> ({match[1]})
      </span>
    );
  }
  match = event.match(/^error\.platform\.(.+)/);
  if (match) {
    return (
      <span>
        <em>error</em> ({match[1]})
      </span>
    );
  }
  return <span>{event}</span>;
};
