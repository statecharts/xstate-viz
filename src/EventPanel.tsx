import React, { useEffect, useRef, useCallback } from 'react';
import { EventObject, State, Interpreter, Machine, assign } from 'xstate';
import AceEditor from 'react-ace';
import { isBuiltInEvent } from './utils';
import styled from 'styled-components';
import { useMachine } from '@xstate/react';
import { StyledButton } from './Button';
import { EventRecord } from './StateChart';
import { format } from 'date-fns';
import { notificationsActor } from './Header';

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
  border-bottom: 1px solid #444;

  > pre {
    margin: 0;
    flex-grow: 1;
  }

  &[data-builtin] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  details {
    width: 100%;
  }

  summary {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    height: 2rem;
    padding: 0 0.5rem;

    > :first-child {
      margin-right: auto;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
`;

const StyledEventPanel = styled.section`
  display: grid;
  grid-template-rows: 1fr 10rem;
  grid-template-areas: 'events' 'editor';
  overflow: hidden;
`;

const StyledEventPanelButtons = styled.div`
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-content: flex-start;
  flex-wrap: wrap;
  overflow-y: auto;
`;

const StyledEventPanelButton = styled.button`
  appearance: none;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: var(--color-primary);
  border: none;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 2rem;
  font-size: 0.75em;
  font-weight: bold;
`;

const StyledEventPanelEditor = styled.div`
  display: grid;
  grid-template-columns: 60% 40%;
  grid-template-rows: 1fr auto;
  grid-template-areas: 'code events' 'code send';
  padding: 1rem;
  border-top: 2px solid #444;

  > ${StyledButton} {
    grid-area: send;
  }

  > ${StyledEventPanelButtons} {
    grid-area events;
  }
`;

const StyledTime = styled.time`
  color: #777;
  margin-left: 0.5rem;
`;

const sendEventContext = {
  eventCode: JSON.stringify({ type: '' }, null, 2)
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
        AUTOFILL: {
          actions: [
            assign({
              eventCode: (_, e) => e.value
            }),
            'moveCursor'
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
  records: EventRecord[];
  state: State<any>;
  service: Interpreter<any>;
}> = ({ records, state, service }) => {
  const [current, send, sendEventService] = useMachine(sendEventMachine, {
    execute: false
  });
  const editorRef = useRef<any>(null);
  const eventsRef = useRef<any>(null);

  useEffect(() => {
    sendEventService.execute(current, {
      moveCursor: () => {
        if (editorRef.current) {
          editorRef.current.moveCursorTo(1);
          editorRef.current.navigateLineEnd();
          editorRef.current.focus();
        }
      }
    });
  }, [current, service]);

  useEffect(() => {
    if (eventsRef.current) {
      eventsRef.current.scrollTop = eventsRef.current.scrollHeight;
    }
  }, [eventsRef.current, records.length]);

  const sendToService = useCallback(
    (eventOrJSON: string | EventObject) => {
      let event = eventOrJSON;

      if (typeof eventOrJSON === 'string') {
        try {
          event = JSON.parse(eventOrJSON);
        } catch (e) {
          notificationsActor.notify({
            message: 'Failed to send event',
            description: e.message,
            severity: 'error'
          });
          return;
        }
      }

      if (!isBuiltInEvent((event as EventObject).type)) {
        service.send(event);
      }
    },
    [service]
  );

  return (
    <StyledEventPanel>
      <StyledEventPanelEvents ref={eventsRef}>
        {records.map(({ event, time }, i) => {
          const pastEventCode = JSON.stringify(event, null, 2);
          const isBuiltIn = isBuiltInEvent(event.type);

          return (
            <StyledEventPanelEvent
              key={i}
              title="Double-click to send, click to edit"
              data-builtin={isBuiltIn || undefined}
            >
              <details>
                <summary>
                  {isBuiltIn ? (
                    <em>{event.type}</em>
                  ) : (
                    <>
                      <strong title={event.type}>{event.type}</strong>
                      <StyledButton
                        data-variant="link"
                        onClick={() => {
                          sendToService(event);
                        }}
                      >
                        Replay
                      </StyledButton>
                      <StyledButton
                        data-variant="link"
                        onClick={e => {
                          e.stopPropagation();

                          send('AUTOFILL', { value: pastEventCode });
                        }}
                      >
                        Edit
                      </StyledButton>
                    </>
                  )}
                  <StyledTime>{format(time, 'hh:mm:ss.SS')}</StyledTime>
                </summary>
                <pre>
                  {isBuiltIn ? event.type : JSON.stringify(event, null, 2)}
                </pre>
              </details>
            </StyledEventPanelEvent>
          );
        })}
      </StyledEventPanelEvents>
      <StyledEventPanelEditor>
        <StyledEventPanelButtons>
          {getNextEvents(state).map(nextEvent => {
            return (
              <StyledEventPanelButton
                key={nextEvent}
                onClick={e => {
                  e.stopPropagation();
                  send('AUTOFILL', {
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
              </StyledEventPanelButton>
            );
          })}
        </StyledEventPanelButtons>
        <AceEditor
          ref={r => {
            if (!r) {
              return;
            }
            editorRef.current = (r as any).editor;
          }}
          mode="javascript"
          theme="monokai"
          editorProps={{ $blockScrolling: true }}
          value={current.context.eventCode}
          onChange={value => {
            send('UPDATE', { value });
          }}
          setOptions={{ tabSize: 2, fontSize: '12px' }}
          width="100%"
          height={'5em'}
          showGutter={false}
          readOnly={false}
          cursorStart={3}
        />
        <StyledButton
          data-variant="primary"
          data-size="full"
          onClick={() => sendToService(current.context.eventCode)}
        >
          Send
        </StyledButton>
      </StyledEventPanelEditor>
    </StyledEventPanel>
  );
};
