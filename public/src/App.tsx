import React, { Component, createContext } from 'react';
import logo from './logo.svg';
import './App.css';
import { StateChart } from '@statecharts/xstate-viz';
import styled from 'styled-components';
import { Machine, assign, EventObject, State } from 'xstate';
import queryString from 'query-string';
import { useMachine } from '@xstate/react';
import { log } from 'xstate/lib/actions';
import { User } from './User';

import { examples } from './examples';

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

const StyledHeader = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: stretch;
  grid-area: header;
  padding: 0.5rem 1rem;
`;

const StyledLogo = styled.img`
  height: 100%;
`;

const StyledLinks = styled.nav`
  display: flex;
  flex-direction: row;
  margin-left: auto;

  &,
  &:visited {
  }
`;

const StyledLink = styled.a`
  text-decoration: none;
  color: #57b0ea;
  text-transform: uppercase;
  display: block;
  font-size: 75%;
  font-weight: bold;
  margin: 0 0.25rem;
`;

function Header() {
  return (
    <StyledHeader>
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

interface AppContext {
  query: {
    gist?: string;
    code?: string;
  };
  token?: string;
  example: any;
  user: any;
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
  }).then(data => data.json());
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

const authActor = createAuthActor();

(window as any).authCallback = (code: string) => {
  authActor.send(code);
};

const appMachine = Machine<AppContext>({
  id: 'app',
  context: {
    query: queryString.parse(window.location.search),
    token: process.env.REACT_APP_TEST_TOKEN,
    example: examples.omni,
    user: undefined
  },
  invoke: {
    id: 'test',
    src: () => cb => {
      authActor.listen(code => {
        cb({ type: 'CODE', code });
      });
    }
  },
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
          initial: 'idle',
          states: {
            idle: {
              on: {
                '': {
                  target: 'fetching',
                  cond: ctx => !!ctx.query.gist
                }
              }
            },
            gistLoaded: {},
            fetching: {
              invoke: {
                src: invokeFetchGist,
                onDone: {
                  target: 'gistLoaded',
                  actions: assign<AppContext>({
                    // @ts-ignore
                    example: (_, e) => {
                      console.log(e);
                      return e.data.files['machine.js'].content;
                    }
                  })
                }
              }
            },
            patchingGist: {
              invoke: {
                src: invokeSaveGist,
                onDone: {
                  actions: log()
                }
              }
            },
            postingGist: {
              invoke: {
                src: invokePostGist,
                onDone: {
                  actions: log()
                }
              }
            }
          },
          on: {
            'GIST.SAVE': [
              { target: '.patchingGist', cond: ctx => !!ctx.query.gist },
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
        src: ctx => {
          return fetch(`https://api.github.com/gists/${ctx.query.gist}`, {
            headers: {
              Accept: 'application/json'
            }
          }).then(data => data.json());
        },
        onDone: {
          target: 'gistLoaded',
          actions: assign<AppContext>({
            // @ts-ignore
            example: (_, e) => {
              console.log(e);
              return e.data.files['machine.js'].content;
            }
          })
        }
      }
    },
    gistLoaded: {}
  },
  on: {
    LOGIN: '.pendingAuthorization'
  }
});

export const AppContext = createContext<{
  state: State<AppContext>;
  send: (event: any) => void;
}>({ state: appMachine.initialState, send: () => {} });

function App() {
  const [current, send] = useMachine(appMachine);

  if (current.matches('fetchingGist')) {
    return <div>Loading...</div>;
  }

  console.log(current);

  return (
    <StyledApp>
      <AppContext.Provider value={{ state: current, send }}>
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
