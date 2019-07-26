import React, { useState, useMemo } from 'react';
import { Interpreter, Machine } from 'xstate';
import { StateChartVisualization } from './StateChartVisualization';
import styled from 'styled-components';

interface StateChartContainerProps {
  service: Interpreter<any, any>;
  onReset: () => void;
}

export const StyledStateChartContainer = styled.section`
  display: grid;
  grid-column-gap: 1rem;
  grid-row-gap: 1rem;
  padding: 0 1rem;

  &[data-child] {
    grid-template-columns: 1fr 1fr;
  }
`;

export const StateChartContainer: React.SFC<StateChartContainerProps> = ({
  service,
  onReset
}) => {
  return (
    <StyledStateChartContainer>
      <StateChartVisualization
        service={service}
        visible={true}
        onSelectService={() => void 0}
        onReset={onReset}
      />
    </StyledStateChartContainer>
  );
};
