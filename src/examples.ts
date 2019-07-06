const examples = {
  omni: `Machine({
    id: 'example',
    initial: 'leaf',
    states: {
      leaf: {
        on: {
          NEXT: 'compound'
        }
      },
      'another leaf': {
        entry: ['one', 'two'],
        exit: ['three', 'four'],
        on: {
          NEXT: {
            target: 'compound',
            cond: function someCondition() { return true }
          },
          NEVER: {
            target: 'leaf',
            cond: function falseCondition() { return false }
          }
        }
      },
      compound: {
        initial: 'child 1',
        states: {
          'child 1': {
            on: {
              NEXT: 'child 2'
            }
          },
          'child 2': {
            initial: 'subchild 1',
            states: {
              'subchild 1': {
                on: { NEXT: 'subchild 2' }
              },
              'subchild 2': {
                on: { NEXT: 'subchild 3', PREV: 'subchild 1' }
              },
              'subchild 3': {
                type: 'final'
              }
            }
          }
        },
        on: {
          PREV: 'leaf',
          NEXT: 'parallel',
          INTERNAL: '.child 1'
        }
      },
      parallel: {
        type: 'parallel',
        states: {
          foo: {},
          bar: {
            initial: 'one',
            states: {
              one: {
                on: {
                  NEXT: 'two'
                }
              },
              two: {
                on: {
                  NEXT: 'three',
                  PREV: 'two'
                }
              },
              three: {
                on: {
                  SELF: 'three',
                  SELF_INTERNAL: '.',
                  PREV: 'two',
                  CYCLE: 'one'
                }
              }
            }
          },
          baz: {
            initial: 'one',
            states: {
              one: {
                on: {
                  TWO_CHILD: 'two.foo'
                }
              },
              two: {
                initial: 'foo',
                states: {
                  foo: {},
                  bar: {},
                  history: {
                    type: 'history'
                  }
                }
              },
              three: {}
            }
          }
        }
      }
    }
  })`,
  light: `
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
        context: { value: 3 },
        states: {
          foo: {
            invoke: Machine({ initial: 'yah', states: { yah: {
              on: {
                FOO: { target: 'yah' }
              }
            }}}),
            on: { EVENT: 'bar' }
          },
          bar: {}
        }
      })
    },
    states: {
      idle: {
        on: {
          FETCH: {
            target: 'pending',
            cond: function canFetch() { return true },
            actions: 'fetchData'
          }
        },
        entry: ['one', 'two', 'three'],
        exit: [send('EVENT', { to: 'child' }), 'foobar']
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
  `,
  another: `
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
            return spawn(Promise.resolve(42));
          }
        })
      }
    }
  });
  `
};

export { examples };
