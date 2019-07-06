import React, { Component, createContext, useState } from 'react';
import './App.css';
import { StateChart, notificationsMachine } from '@statecharts/xstate-viz';
import styled from 'styled-components';
import { Machine, assign, EventObject, State, Interpreter } from 'xstate';
import queryString from 'query-string';
import { useMachine } from '@xstate/react';
import { log, send } from 'xstate/lib/actions';
import { User } from './User';

import { examples } from './examples';
import { Header, notificationsActor } from './Header';

const StyledApp = styled.main`
  --sidebar-width: 25rem;

  height: 100%;
  display: grid;
  grid-template-areas:
    'header sidebar'
    'content content';
  grid-template-rows: 3rem auto;
  grid-template-columns: auto var(--sidebar-width);
`;

export const StyledHeader = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: stretch;
  grid-area: header;
  padding: 0.5rem 1rem;
  z-index: 1;
`;

export const StyledLogo = styled.img`
  height: 100%;
`;

export const StyledLinks = styled.nav`
  display: flex;
  flex-direction: row;
  margin-left: auto;

  &,
  &:visited {
  }
`;

export const StyledLink = styled.a`
  text-decoration: none;
  color: #57b0ea;
  text-transform: uppercase;
  display: block;
  font-size: 75%;
  font-weight: bold;
  margin: 0 0.25rem;
`;

interface AppContext {
  query: {
    gist?: string;
    code?: string;
  };
  token?: string;
  example: any;
  user: any;
  /**
   * Gist ID
   */
  gist?: string;
}

const invokeSaveGist = (ctx: AppContext, e: EventObject) => {
  return fetch(`https://api.github.com/gists/` + ctx.query.gist!, {
    method: 'post',
    body: JSON.stringify({
      description: 'XState test',
      files: {
        'machine.js': { content: e.code }
      }
    }),
    headers: {
      Authorization: `token ${ctx.token}`
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error('Unable to save gist');
    }

    return response.json();
  });
};

const invokePostGist = (ctx: AppContext, e: EventObject) => {
  return fetch(`https://api.github.com/gists`, {
    method: 'post',
    body: JSON.stringify({
      description: 'XState test',
      files: {
        'machine.js': { content: e.code }
      }
    }),
    headers: {
      Authorization: `token ${ctx.token}`
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error('Unable to post gist');
    }

    return response.json();
  });
};

const invokeFetchGist = (ctx: AppContext) => {
  return fetch(`https://api.github.com/gists/${ctx.query.gist}`, {
    headers: {
      Accept: 'application/json'
    }
  }).then(async data => {
    if (!data.ok) {
      throw new Error((await data.json()).message);
    }

    return data.json();
  });
};

const getUser = (ctx: AppContext) => {
  return fetch(`https://api.github.com/user`, {
    headers: {
      Authorization: `token ${ctx.token}`
    }
  }).then(response => {
    if (!response.ok) {
      throw new Error('Unable to get user');
    }

    return response.json();
  });
};

function createAuthActor() {
  let listener: ((code: string) => void) | null = null;
  let code: string | null = null;

  return {
    send(_code: string) {
      code = _code;

      if (listener) {
        listener(_code);
      }
    },
    listen(l: (code: string) => void) {
      listener = l;

      if (code) {
        listener(code);
      }
    }
  };
}

function updateQuery(query: Record<string, string>): void {
  if (!window.history) return;

  const fullQuery = {
    ...queryString.parse(window.location.search),
    ...query
  };

  window.history.replaceState(null, '', `?${queryString.stringify(fullQuery)}`);
}

(window as any).updateQuery = updateQuery;

const authActor = createAuthActor();

(window as any).authCallback = (code: string) => {
  authActor.send(code);
};

const query = queryString.parse(window.location.search);

const appMachine = Machine<AppContext>({
  id: 'app',
  context: {
    query,
    token: process.env.REACT_APP_TEST_TOKEN,
    gist: (query.gist as string) || undefined,
    example: examples.omni,
    user: undefined
  },
  invoke: [
    {
      id: 'test',
      src: () => cb => {
        authActor.listen(code => {
          cb({ type: 'CODE', code });
        });
      }
    }
  ],
  initial: 'checkingCode',
  states: {
    checkingCode: {
      on: {
        '': [
          {
            target: 'authorized',
            cond: ctx => !!ctx.token
          },
          {
            target: 'authorizing',
            cond: ctx => {
              return !!ctx.query.code;
            }
          },
          {
            target: 'fetchingGist',
            cond: ctx => {
              return !!ctx.query.gist;
            }
          },
          {
            target: 'unauthorized',
            actions: assign<AppContext>({
              example: examples.light
            })
          }
        ]
      }
    },
    authorizing: {
      invoke: {
        src: (ctx, e) => {
          return fetch(
            `http://xstate-gist.azurewebsites.net/api/GistPost?code=${e.code}`
          )
            .then(response => {
              if (!response.ok) {
                throw new Error('unauthorized');
              }

              return response.json();
            })
            .then(data => {
              if (data.error) {
                throw new Error('expired code');
              }

              return data;
            });
        },
        onDone: {
          target: 'authorized',
          actions: assign<AppContext>({
            token: (ctx, e) => e.data.access_token
          })
        },
        onError: {
          target: 'unauthorized',
          actions: (_, e) => alert(e.data)
        }
      }
    },
    authorized: {
      type: 'parallel',
      states: {
        user: {
          initial: 'fetching',
          states: {
            fetching: {
              invoke: {
                src: getUser,
                onDone: {
                  target: 'loaded',
                  actions: assign<AppContext>({
                    // @ts-ignore
                    user: (_, e) => e.data
                  })
                }
              }
            },
            loaded: {}
          }
        },
        gist: {
          initial: 'unknown',
          states: {
            idle: {},
            unknown: {
              on: {
                '': [
                  {
                    target: 'fetching',
                    cond: ctx => !!ctx.gist
                  },
                  { target: 'idle' }
                ]
              }
            },
            gistLoaded: {
              entry: (ctx, e) => notificationsActor.notify('Gist loaded!')
            },
            fetching: {
              invoke: {
                src: invokeFetchGist,
                onDone: {
                  target: 'gistLoaded',
                  actions: assign<AppContext>({
                    // @ts-ignore
                    example: (_, e) => {
                      return e.data.files['machine.js'].content;
                    }
                  })
                },
                onError: {
                  target: 'idle',
                  actions: [
                    assign<AppContext>({
                      gist: undefined
                    }),
                    ctx => notificationsActor.notify('Gist not found.')
                  ]
                }
              }
            },
            patchingGist: {
              invoke: {
                src: invokeSaveGist,
                onDone: {
                  actions: [
                    log(),
                    ctx => notificationsActor.notify('Gist saved!')
                  ]
                }
              }
            },
            postingGist: {
              invoke: {
                src: invokePostGist,
                onDone: {
                  target: 'posted',
                  actions: [
                    assign<AppContext>({
                      gist: (_, e) => e.data.id
                    }),
                    () => notificationsActor.notify('Gist created!')
                  ]
                }
              }
            },
            posted: {
              entry: ({ gist }) => updateQuery({ gist: gist! })
            }
          },
          on: {
            'GIST.SAVE': [
              { target: '.patchingGist', cond: ctx => !!ctx.gist },
              { target: '.postingGist' }
            ]
          }
        }
      }
    },
    unauthorized: {
      on: {
        LOGIN: 'pendingAuthorization'
      }
    },
    pendingAuthorization: {
      entry: () => {
        window.open(
          'https://github.com/login/oauth/authorize?client_id=39c1ec91c4ed507f6e4c&scope=gist',
          'Login with GitHub',
          'width=800,height=600'
        );
      },
      on: {
        CODE: 'authorizing'
      }
    },
    newGist: {},
    fetchingGist: {
      invoke: {
        src: invokeFetchGist,
        onDone: {
          target: 'gistLoaded',
          actions: assign<AppContext>({
            // @ts-ignore
            example: (_, e) => {
              console.log('...', e);
              return e.data.files['machine.js'].content;
            }
          })
        }
      }
    }
  },
  on: {
    LOGIN: '.pendingAuthorization'
  }
});

export const AppContext = createContext<{
  state: State<AppContext>;
  send: (event: any) => void;
  service: Interpreter<AppContext>;
}>({ state: appMachine.initialState, send: () => {}, service: {} as any });

function App() {
  const [current, send, service] = useMachine(appMachine);

  if (current.matches('fetchingGist')) {
    return <div>Loading...</div>;
  }

  return (
    <StyledApp>
      <AppContext.Provider value={{ state: current, send, service }}>
        <User />
        <Header />
        <StateChart
          machine={current.context.example}
          onSave={code => {
            send('GIST.SAVE', { code });
          }}
        />
      </AppContext.Provider>
    </StyledApp>
  );
}

export default App;
