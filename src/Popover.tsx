import styled from 'styled-components';
import React from 'react';

export const StyledPopover = styled.aside`
  position: absolute;
  bottom: 100%;
  left: 0;
  background: black;
  color: white;
  border-radius: var(--radius);
  pointer-events: none;
  opacity: 0;
`;

export const Popover: React.SFC<any> = ({ children }) => {
  return <StyledPopover>{children}</StyledPopover>;
};
