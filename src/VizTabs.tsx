import React, { useState, useMemo } from 'react';
import { Interpreter, Machine } from 'xstate';
import { StateChartVisualization } from './StateChartVisualization';
import styled from 'styled-components';

interface VizTabsProps {
  service: Interpreter<any, any>;
  selectedService?: Interpreter<any, any>;
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

const StyledVizTabsTab = styled.li`
  padding: 0.5rem;
  background: var(--color-border);

  &:not(:last-child) {
    border-right: 1px solid black;
  }

  &[data-active] {
    background: var(--color-background);
  }
`;

export const VizTabs: React.SFC<VizTabsProps> = ({
  service,
  selectedService
}) => {
  const currentService = selectedService;

  return (
    <StyledVizContainer data-child={!!selectedService || undefined}>
      <StateChartVisualization service={service} visible={true} />

      {selectedService && (
        <StateChartVisualization service={selectedService} visible={true} />
      )}
    </StyledVizContainer>
  );
};
