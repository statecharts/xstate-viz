import React, { useState, useEffect } from 'react';
import { EventObject, State, Interpreter, Machine, assign } from 'xstate';
import AceEditor from 'react-ace';
import { isBuiltInEvent } from './utils';
import styled from 'styled-components';
import { useMachine } from '@xstate/react';

function getNextEvents(state: State<any>): string[] {
  const { nextEvents } = state;

  return nextEvents.filter(eventType => {
    return !isBuiltInEvent(eventType);
  });
}

const StyledEventPanelEvents = styled.ul`
  list-style: none;
  padding: 0;
  overflow-y: scroll;
`;

const StyledEventPanelEvent = styled.li`
  display: flex;
  flex-direction: row;
  align-items: center;

  > pre {
    margin: 0;
    flex-grow: 1;
  }

  &[data-builtin] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledEventPanel = styled.section`
  display: grid;
  grid-template-rows: 10rem 1fr;
  overflow: hidden;
`;

const StyledEventPanelEditor = styled.div``;

const sendEventContext = {
  eventCode: JSON.stringify({ type: '' })
};

const sendEventMachine = Machine<typeof sendEventContext>({
  id: 'sendEvent',
  initial: 'idle',
  context: sendEventContext,
  states: {
    idle: {
      on: {
        UPDATE: {
          actions: assign({
            eventCode: (_, e) => e.value
          })
        },
        UPDATE_AND_SEND: {
          actions: [
            assign({
              eventCode: (_, e) => e.value
            }),
            'sendToService'
          ]
        },
        SEND: {
          actions: 'sendToService'
        }
      }
    }
  }
});

export const EventPanel: React.FunctionComponent<{
  events: EventObject[];
  state: State<any>;
  service: Interpreter<any>;
}> = ({ events, state, service }) => {
  const [current, send, sendEventService] = useMachine(sendEventMachine, {
    execute: false
  });

  useEffect(() => {
    sendEventService.execute(current, {
      sendToService: ctx => service.send(JSON.parse(ctx.eventCode))
    });
  }, [current]);

  return (
    <StyledEventPanel>
      <StyledEventPanelEditor>
        {getNextEvents(state).map(nextEvent => {
          return (
            <button
              key={nextEvent}
              onClick={e => {
                e.stopPropagation();
                send('UPDATE', {
                  value: JSON.stringify(
                    {
                      type: nextEvent
                    },
                    null,
                    2
                  )
                });
              }}
            >
              {nextEvent}
            </button>
          );
        })}
        <AceEditor
          mode="javascript"
          theme="monokai"
          editorProps={{ $blockScrolling: true }}
          value={current.context.eventCode}
          onChange={value => {
            send('UPDATE', { value });
          }}
          setOptions={{ tabSize: 2, fontSize: '12px' }}
          width="100%"
          height={'8em'}
          showGutter={false}
          readOnly={false}
        />
        <button
          onClick={() => service.send(JSON.parse(current.context.eventCode))}
        >
          Send
        </button>
      </StyledEventPanelEditor>
      <StyledEventPanelEvents>
        {events.map((event, i) => {
          const pastEventCode = JSON.stringify(event, null, 2);
          const isBuiltIn = isBuiltInEvent(event.type);

          return (
            <StyledEventPanelEvent
              key={i}
              title="Click to send"
              data-builtin={isBuiltIn || undefined}
              onClick={e => {
                !isBuiltIn
                  ? send('UPDATE_AND_SEND', { value: pastEventCode })
                  : undefined;
              }}
            >
              <pre>{JSON.stringify(event, null, 2)}</pre>
              {!isBuiltIn && (
                <button
                  onClick={e => {
                    e.stopPropagation();

                    send('UPDATE', { value: pastEventCode });
                  }}
                >
                  Edit
                </button>
              )}
            </StyledEventPanelEvent>
          );
        })}
      </StyledEventPanelEvents>
    </StyledEventPanel>
  );
};
