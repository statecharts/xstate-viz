import React from 'react';
import styled from 'styled-components';

const StyledLoader = styled.div`
  padding: 1rem;
  padding-top: 1.5rem;
  margin: auto auto;
  transform-style: preserve-3d;
  perspective: 100px;
  text-align: center;
  font-size: 80%;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:before,
  &:after {
    content: '';
    width: 1rem;
    height: 1rem;
    top: 0;
    left: calc(50% - 0.5rem);
    position: absolute;
    border: 2px solid rgba(87, 176, 234, 1);
    border-radius: 0.2rem;
    animation: loader-box 1s infinite both;
  }

  &:after {
    animation-delay: 0.5s;
  }

  @keyframes loader-box {
    from {
      transform: rotateY(40deg) translateX(150%);
      opacity: 0;
    }
    50% {
      transform: none;
      opacity: 1;
    }
    to {
      transform: rotateY(-40deg) translateX(-150%);
      opacity: 0;
    }
  }
`;

export const Loader: React.FunctionComponent = ({
  children = 'Loading...'
}) => {
  return <StyledLoader>{children}</StyledLoader>;
};
