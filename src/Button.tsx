import React from 'react';
import styled from 'styled-components';

export const StyledButton = styled.button`
  appearance: none;
  background: transparent;
  color: white;
  height: 2rem;
  border-radius: 0.25rem;
  border: none;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    background: white;
  }

  &:focus {
    outline: none;
  }

  &[data-variant='primary'] {
    background: white;
    color: #111;
    border-radius: 2px;
    border: none;
  }

  &[data-variant='secondary'] {
    background: #656565;
    border-radius: 2px;
    border: none;
  }

  &[data-variant='link'] {
    background: transparent;
    color: var(--color-link);
    letter-spacing: 0;
    height: auto;
    padding: 0;
    margin-left: 0.5rem;
  }

  &[data-size='full'] {
    width: 100%;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
