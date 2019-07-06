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
    background: var(--color-secondary);
    color: white;
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

  &[data-variant='reset'] {
    background: var(--color-secondary);
    border: none;
    margin: 0;
    margin-left: 0.5rem;
    padding: 0.25rem 0.5rem;
    height: auto;
    letter-spacing: 0;
    font-size: 50%;
    opacity: 0.8;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 1;
    }
  }
`;
