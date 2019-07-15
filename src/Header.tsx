import React, { useContext } from 'react';
import { Notifications, notificationsMachine } from './Notifications';
import { StyledHeader, StyledLogo, StyledLinks, StyledLink } from './App';
import { interpret } from 'xstate';
import { Actor } from 'xstate/lib/Actor';

import { Notification } from './Notifications';

const notificationsService = interpret(notificationsMachine).start();

export const notificationsActor: Actor & {
  notify: (message: string | Notification) => void;
} = {
  toJSON: () => ({ id: 'notifications' }),
  id: 'notifications',
  send: notificationsService.send.bind(notificationsService),
  subscribe: notificationsService.subscribe.bind(notificationsService),
  notify: (message: string | Notification) =>
    notificationsService.send({
      type: 'NOTIFICATIONS.QUEUE',
      data:
        typeof message === 'string' ? { message, severity: 'info' } : message
    })
};

export function Header() {
  return (
    <StyledHeader>
      <StyledLogo />
      <StyledLinks>
        <StyledLink
          href="https://github.com/davidkpiano/xstate"
          target="_xstate-github"
        >
          GitHub
        </StyledLink>
        <StyledLink href="https://xstate.js.org/docs" target="_xstate-docs">
          Docs
        </StyledLink>
        <StyledLink
          href="https://spectrum.chat/statecharts"
          target="_statecharts-community"
        >
          Community
        </StyledLink>
        <StyledLink href="https://opencollective.com/xstate" target="_sponsor">
          Sponsor 💙
        </StyledLink>
      </StyledLinks>
    </StyledHeader>
  );
}
