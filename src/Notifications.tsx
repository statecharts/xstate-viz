import React, { useEffect, useState } from 'react';
import { Machine, assign, State } from 'xstate';
import { Actor } from 'xstate/lib/Actor';
import { produce } from 'immer';
import { useMachine } from '@xstate/react';
import { log } from 'xstate/lib/actions';
import styled from 'styled-components';

interface Notification {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface NotificationsContext {
  notifications: Array<Notification>;
}

export const notificationsMachine = Machine<NotificationsContext>({
  id: 'notifications',
  context: {
    notifications: []
  },
  initial: 'inactive',
  states: {
    inactive: {},
    active: {
      entry: log()
    }
  },
  on: {
    'NOTIFICATIONS.QUEUE': {
      target: '.active',
      actions: assign<NotificationsContext>({
        notifications: (ctx, e) =>
          produce(ctx.notifications, draft => {
            draft.push(e.data);
          })
      })
    }
  }
});

interface NotificationsProps {
  notifier: Actor<State<NotificationsContext>>;
}

const StyledNotifications = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;

  > * {
    pointer-events: auto;
  }
`;

const StyledNotification = styled.div`
  padding: 1rem;
  margin: 1rem;
  background: green;
  color: white;
`;

export const Notifications: React.FunctionComponent<NotificationsProps> = ({
  notifier
}) => {
  const [current, setCurrent] = useState<
    State<NotificationsContext> | undefined
  >();

  useEffect(() => {
    notifier.subscribe(state => {
      setCurrent(state);
    });
  }, []);

  if (!current) {
    return null;
  }

  return (
    <StyledNotifications>
      {current.context.notifications.map((notification, i) => {
        return (
          <StyledNotification key={i}>
            {notification.message}
          </StyledNotification>
        );
      })}
    </StyledNotifications>
  );
};
