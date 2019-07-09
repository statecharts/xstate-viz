import React, { useEffect, useRef } from 'react';
import { EventObject, State, Interpreter, Machine, assign } from 'xstate';
import AceEditor from 'react-ace';
import { isBuiltInEvent } from './utils';
import styled from 'styled-components';
import { useMachine } from '@xstate/react';
import { StyledButton } from './Button';
import { EventRecord } from './StateChart';
import { format } from 'date-fns';

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
  padding: 0.5rem;
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

    > :first-child {
      margin-right: auto;
    }
  }
`;

const StyledEventPanel = styled.section`
  display: grid;
  grid-template-rows: 1fr 10rem;
  grid-template-areas: 'events' 'editor';
  overflow: hidden;
`;

const StyledEventPanelButton = styled.button`
  appearance: none;
  margin-right: 0.5rem;
  background-color: var(--color-primary);
  border: none;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 2rem;
  font-size: 0.75em;
  font-weight: bold;
`;

const StyledEventPanelEditor = styled.div``;

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
      sendToService: ctx => service.send(JSON.parse(ctx.eventCode)),
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
                        data-size="small"
                        onClick={e => {
                          !isBuiltIn
                            ? send('UPDATE_AND_SEND', { value: pastEventCode })
                            : undefined;
                        }}
                      >
                        Replay
                      </StyledButton>
                      <StyledButton
                        data-size="small"
                        onClick={e => {
                          e.stopPropagation();

                          send('AUTOFILL', { value: pastEventCode });
                        }}
                      >
                        Edit
                      </StyledButton>
                    </>
                  )}
                  <time>{format(time, 'hh:mm:ss.SS')}</time>
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
          height={'8em'}
          showGutter={false}
          readOnly={false}
          cursorStart={3}
        />
        <StyledButton
          onClick={() => service.send(JSON.parse(current.context.eventCode))}
        >
          Send
        </StyledButton>
      </StyledEventPanelEditor>
    </StyledEventPanel>
  );
};
