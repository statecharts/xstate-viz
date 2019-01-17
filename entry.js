import "babel-polyfill";
import React from 'react';
import { render } from 'react-dom';
import { StateChart } from "./examples/src/lib/StateChart";
let state = {
  inital: 'foo',
  states: {
    foo: {}
  }
}
let machine = "\n// Available variables:\n// Machine (machine factory function)\n// XState (all XState exports)\n\nconst lightMachine = Machine({\n  id: \"light\",\n  initial: \"green\",\n  states: {\n    green: {\n      on: { TIMER: \"yellow\" }\n    },\n    yellow: {\n      on: { TIMER: \"red\" }\n    },\n    red: {\n      on: { TIMER: \"green\" }\n    }\n  }\n});\n";
if (document.getElementById('root')) {
  render(
    <StateChart machine={machine} />,
    document.getElementById('root')
  );
}
