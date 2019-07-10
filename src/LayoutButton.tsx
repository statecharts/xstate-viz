import React from 'react';
import styled from 'styled-components';

export const StyledLayoutButton = styled.button`
  appearance: none;
  background: white;
  box-shadow: var(--shadow);
  font-weight: bold;
  text-transform: uppercase;
  padding: 0.5rem 1rem;
  border-top-left-radius: 1rem;
  border-bottom-left-radius: 1rem;
  color: black;
  border: none;
  position: absolute;
  top: 0;
  right: 0;
  cursor: pointer;
  z-index: 2;
  margin-top: 1rem;
  opacity: 0.7;
  transition: all var(--duration) var(--easing);
  transform: translateX(0.5rem);

  &:focus,
  &:hover {
    outline: none;
  }

  &:hover {
    opacity: 1;
    transform: none;
  }

  [data-layout='viz'] & {
    right: 100%;
    color: black;
  }
`;

export const LayoutButton: React.FunctionComponent<{
  onClick: () => void;
}> = ({ onClick, children }) => {
  return <StyledLayoutButton onClick={onClick}>{children}</StyledLayoutButton>;
};
