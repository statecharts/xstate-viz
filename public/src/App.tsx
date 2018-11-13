import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import { StateChart } from "@statecharts/xstate-viz";
import { Machine, StateNode, MachineOptions } from "xstate";
import { assign } from "xstate/lib/actions";

const lightMachine = Machine({
  id: "light",
  initial: "green",
  states: {
    green: {
      on: { TIMER: "yellow" }
    },
    yellow: {
      on: { TIMER: "red" }
    },
    red: {
      on: { TIMER: "green" }
    }
  }
});

class App extends Component {
  render() {
    return (
      <div className="App">
        <StateChart machine={lightMachine} />
      </div>
    );
  }
}

export default App;
