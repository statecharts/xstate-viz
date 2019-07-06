import React, { useContext } from 'react';
import logo from './logo.svg';
import { Notifications, notificationsMachine } from '@statecharts/xstate-viz';
import {
  AppContext,
  StyledHeader,
  StyledLogo,
  StyledLinks,
  StyledLink
} from './App';
import { interpret } from 'xstate';
import { Actor } from 'xstate/lib/Actor';

const notificationsService = interpret(notificationsMachine)
  .onTransition(s => console.log(s))
  .start();

export const notificationsActor: Actor & {
  notify: (message: string) => void;
} = {
  toJSON: () => ({ id: 'notifications' }),
  id: 'notifications',
  send: notificationsService.send.bind(notificationsService),
  subscribe: notificationsService.subscribe.bind(notificationsService),
  notify: (message: string) =>
    notificationsService.send({
      type: 'NOTIFICATIONS.QUEUE',
      data: {
        type: 'success',
        message
      }
    })
};

export function Header() {
  return (
    <StyledHeader>
      <Notifications notifier={notificationsActor} />
      <StyledLogo src={logo} />
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
      </StyledLinks>
    </StyledHeader>
  );
}
