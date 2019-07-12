import React, { useEffect, useState } from 'react';
import { Machine, assign, State, actions } from 'xstate';
import { Actor } from 'xstate/lib/Actor';
import { produce } from 'immer';
import { useMachine } from '@xstate/react';
import { log } from 'xstate/lib/actions';
import styled from 'styled-components';

export interface Notification {
  message: string;
  description?: string;
  severity: 'success' | 'warning' | 'error';
}

interface NotificationsContext {
  notifications: Array<Notification>;
}

export const notificationsMachine = Machine<NotificationsContext>(
  {
    id: 'notifications',
    context: {
      notifications: []
    },
    initial: 'inactive',
    states: {
      inactive: {},
      active: {
        entry: log(),
        on: {
          'NOTIFICATION.DISMISS': {
            actions: assign<NotificationsContext>({
              notifications: (ctx, e) =>
                produce(ctx.notifications, draft => {
                  draft.pop();
                })
            })
          }
        }
      }
    },
    on: {
      'NOTIFICATIONS.QUEUE': {
        target: '.active',
        actions: [
          assign<NotificationsContext>({
            notifications: (ctx, e) =>
              produce(ctx.notifications, draft => {
                draft.unshift(e.data);
              })
          }),
          actions.send('NOTIFICATION.DISMISS', { delay: 'TIMEOUT' })
        ]
      }
    }
  },
  {
    delays: {
      TIMEOUT: 5000
    }
  }
);

interface NotificationsProps {
  notifier: Actor<State<NotificationsContext>>;
}

const StyledNotificationDismissButton = styled.button`
  appearance: none;
  background: transparent;
  color: white;
`;

const StyledNotification = styled.div`
  padding: 0.5rem 1rem;
  margin: 1rem;
  border-radius: 1rem;
  background: #2f86eb;
  color: white;
  font-weight: bold;
  animation: notification-slideDown calc(var(--timeout, 4000) * 1ms) ease both;
  will-change: transform;

  &[data-severity='success'] {
    background: #40d38d;
  }

  &[data-severity='info'] {
    background: #2f86eb;
  }

  &[data-severity='error'] {
    background: red;
  }

  > ${StyledNotificationDismissButton} {
    position: absolute;
    right: 0;
  }

  @keyframes notification-slideDown {
    from {
      transform: translateY(-100%);
    }
    20%,
    to {
      transform: none;
    }
    20%,
    50% {
      opacity: 1;
    }
    from,
    to {
      opacity: 0;
    }
  }
`;

const StyledNotifications = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;

  > ${StyledNotification} {
    position: absolute;
    pointer-events: auto;
  }
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

  const { notifications } = current.context;

  return (
    <StyledNotifications>
      {notifications.map((notification, i) => {
        return (
          <StyledNotification
            key={notifications.length - i}
            data-severity={notification.severity}
            style={{
              // @ts-ignore
              '--timeout': 5000
            }}
          >
            <strong>{notification.message}</strong>
            {notification.description && (
              <div>
                <small>{notification.description}</small>
              </div>
            )}
            <StyledNotificationDismissButton
              onClick={() =>
                notifier.send({ type: 'NOTIFICATION.DISMISS', index: i })
              }
            >
              x
            </StyledNotificationDismissButton>
          </StyledNotification>
        );
      })}
    </StyledNotifications>
  );
};
