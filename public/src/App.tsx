import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { StateChart } from '@statecharts/xstate-viz';
import styled from 'styled-components';

const lightMachineSrc = `
// Available variables:
// Machine (machine factory function)
// assign (action)
// XState (all XState exports)

const fetchMachine = Machine({
  id: 'fetch',
  context: { attempts: 0 },
  initial: 'idle',
  invoke: {
    id: 'child',
    src: () => Machine({
      initial: 'foo',
      states: {
        foo: {
          on: { EVENT: 'bar' }
        },
        bar: {}
      }
    })
  },
  states: {
    idle: {
      
      on: { FETCH: 'pending' },
      exit: send('EVENT', { to: 'child' })
    },
    pending: {
      entry: assign({
        attempts: ctx => ctx.attempts + 1
      }),
      after: {
        TIMEOUT: 'rejected'
      },
      on: {
        RESOLVE: 'fulfilled',
        REJECT: 'rejected'
      }
    },
    fulfilled: {
      initial: 'first',
      states: {
        first: {
          on: {
            NEXT: 'second'
          }
        },
        second: {
          on: {
            NEXT: 'third'
          }
        },
        third: {
          type: 'final'
        }
      }
    },
    rejected: {
      entry: assign({
        ref: () => spawn(Machine({ initial: 'foo', states: {foo: {}}}))
      }),
      initial: 'can retry',
      states: {
        'can retry': {
          on: {
            '': {
              target: 'failure',
              cond: 'maxAttempts'
            }
          }
        },
        failure: {
          on: {
            RETRY: undefined,
          },
          type: 'final'
        }
      },
      on: {
        RETRY: 'pending'
      }
    }
  }
}, {
  guards: {
    maxAttempts: ctx =>  ctx.attempts >= 5
  },
  delays: {
    TIMEOUT: 2000
  }
});
`;

const anotherMachine = `
const m = Machine({
  initial: 'b',
  context: {
    foo: undefined
  },
  states: {
    b: { on: {T:'yeah'}},
    yeah: {
      entry: assign({
        foo: () => {
          console.log('maaaaaaa');
          return spawn(Promise.resolve(42));
        }
      })
    }
  }
});
`;

const StyledApp = styled.main`
  height: 100%;
  display: grid;
  grid-template-areas:
    'header'
    'content';
  grid-template-rows: 3rem auto;
  grid-template-columns: 100%;
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

class Header extends Component {
  render() {
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
}

class App extends Component {
  render() {
    return (
      <StyledApp>
        <Header />
        <StateChart machine={lightMachineSrc} />
      </StyledApp>
    );
  }
}

export default App;
