import React from 'react'
import styled from 'styled-components'
import { Logo } from './logo'

const StyledHeader = styled.header`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: stretch;
  grid-area: header;
  padding: 0.5rem 1rem;
  z-index: 1;
  white-space: nowrap;
`

const StyledLogo = styled(Logo)`
  height: 2rem;
`

const StyledLink = styled.a`
  text-decoration: none;
  color: #57b0ea;
  text-transform: uppercase;
  display: block;
  font-size: 75%;
  font-weight: bold;
  margin: 0 0.25rem;
`

const StyledLinks = styled.nav`
  display: flex;
  flex-direction: row;

  > ${StyledLink} {
    line-height: 2rem;
    margin-left: 1rem;
  }

  &,
  &:visited {
  }
`
export function Header() {
  return (
    <StyledHeader>
      <StyledLogo />
      <StyledLinks>
        <StyledLink
          href="https://github.com/statelyai/xstate"
          target="_xstate-github"
        >
          GitHub
        </StyledLink>
        <StyledLink href="https://xstate.js.org/docs" target="_xstate-docs">
          Docs
        </StyledLink>
        <StyledLink
          href="https://discord.gg/xstate"
          target="_statecharts-community"
        >
          Community
        </StyledLink>
        <StyledLink href="https://opencollective.com/xstate" target="_sponsor">
          Sponsor 💙
        </StyledLink>
      </StyledLinks>
    </StyledHeader>
  )
}
