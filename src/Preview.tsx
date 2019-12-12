import React, { useReducer } from "react";
import { StateChart } from "./index";
import styled from "styled-components";
import queryString from "query-string";
import { Header } from "./Header";
import { Logo } from "./logo";
import { LayoutButton, StyledLayoutButton } from "./LayoutButton";

export const StyledHeader = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: stretch;
  grid-area: header;
  padding: 0.5rem 1rem;
  z-index: 1;
  white-space: nowrap;
`;

const StyledApp = styled.main`
  --color-app-background: #fff;
  --color-border: #c9c9c9;
  --color-primary: rgba(87, 176, 234, 1);
  --color-primary-faded: rgba(87, 176, 234, 0.5);
  --color-primary-shadow: rgba(87, 176, 234, 0.1);
  --color-link: rgba(87, 176, 234, 1);
  --color-disabled: #b3b3b3;
  --color-edge: #c9c9c9;
  --color-edge-active: var(--color-primary);
  --color-secondary: rgba(255, 152, 0, 1);
  --color-secondary-light: rgba(255, 152, 0, 0.5);
  --color-sidebar: #272722;
  --color-gray: #555;
  --color-failure: #ee7170;
  --color-success: #31ae00;
  --radius: 0.2rem;
  --border-width: 2px;
  --sidebar-width: 25rem;
  --shadow: 0 0.5rem 1rem var(--shadow-color, rgba(0, 0, 0, 0.2));
  --duration: 0.2s;
  --easing: cubic-bezier(0.5, 0, 0.5, 1);

  height: 100%;
  display: grid;
  grid-template-areas:
    "header sidebar"
    "content content";
  grid-template-rows: 3rem auto;
  grid-template-columns: auto var(--sidebar-width);
  overflow: hidden;

  > ${StyledLayoutButton} {
    display: inline-block;
    grid-row: 2;
    grid-column: -1;
  }

  @media (max-width: 900px) {
    grid-template-columns: 50% 50%;
  }

  &[data-embed] {
    grid-template-rows: 0 auto;

    > ${StyledHeader} {
      display: none;
    }
  }
`;

export const StyledLogo = styled(Logo)`
  height: 2rem;
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

export const StyledLinks = styled.nav`
  display: flex;
  flex-direction: row;

  > ${StyledLink} {
    line-height: 2rem;
    margin-left: 1rem;
  }

  &,
  &:visited {
  }
`;

const query = queryString.parse(window.location.search);

function layoutReducer(state: string, event: string) {
  switch (state) {
    case "full":
      switch (event) {
        case "TOGGLE":
          return "viz";
        default:
          return state;
      }
    case "viz":
      switch (event) {
        case "TOGGLE":
          return "full";
        default:
          return state;
      }
    default:
      return state;
  }
}

export function Preview({ machine }: { machine: any }) {
  const [layout, dispatchLayout] = useReducer(
    layoutReducer,
    (query.layout as string) || (!!query.embed ? "viz" : "full")
  );

  return (
    <StyledApp data-layout={layout} data-embed={query.embed}>
      <Header />
      <>
        <StateChart machine={machine} onSave={() => {}} previewOnly={true} />
        <LayoutButton onClick={() => dispatchLayout("TOGGLE")}>
          {({ full: "Hide", viz: "Code" } as Record<string, string>)[layout] ||
            "Show"}
        </LayoutButton>
      </>
    </StyledApp>
  );
}
