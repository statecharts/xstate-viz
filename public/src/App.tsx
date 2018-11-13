import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import { StateChart } from "@statecharts/xstate-viz";
import { Machine, StateNode, MachineOptions } from "xstate";
import { assign } from "xstate/lib/actions";
import styled from "styled-components";

const lightMachineSrc = `
// Available variables:
// Machine (machine factory function)
// XState (all XState exports)

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
`;

const StyledApp = styled.main`
  height: 100%;
  display: grid;
  grid-template-areas:
    "header"
    "content";
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

const StyledLinks = styled.a`
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
