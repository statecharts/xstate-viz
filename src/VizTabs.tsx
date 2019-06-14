import React, { useState, useMemo } from 'react';
import { Interpreter, Machine } from 'xstate';
import { StateChartVisualization } from './StateChartVisualization';
import styled from 'styled-components';

interface VizTabsProps {
  service: Interpreter<any, any>;
}

export const StyledVizTabsTabs = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-end;
  margin: 0;
  padding: 0;
`;

export const StyledVizContainer = styled.section`
  display: grid;
  grid-column-gap: 1rem;
  grid-row-gap: 1rem;

  &[data-child] {
    grid-template-columns: 1fr 1fr;
  }
`;

export const VizTabs: React.SFC<VizTabsProps> = ({ service }) => {
  return (
    <StyledVizContainer>
      <StateChartVisualization
        service={service}
        visible={true}
        onSelectService={() => void 0}
      />
    </StyledVizContainer>
  );
};
