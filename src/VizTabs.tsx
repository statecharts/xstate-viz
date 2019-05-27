import React, { useState, useMemo } from 'react';
import { Interpreter } from 'xstate';
import { StateChartVisualization } from './StateChartVisualization';
import styled from 'styled-components';

interface VizTabsProps {
  service: Interpreter<any, any>;
  selectedService?: Interpreter<any, any>;
}

const StyledVizTabsTabs = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-end;
  margin: 0;
  padding: 0;
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
  const childServices = useMemo(() => {
    return Array.from((service as any).children.values()).filter(
      (child): child is Interpreter<any, any> => child instanceof Interpreter
    );
  }, [(service as any).children.size]);
  const currentService = selectedService;

  return (
    <div>
      <StyledVizTabsTabs>
        {[service, ...childServices].map(s => {
          return <StyledVizTabsTab key={s.id}>{s.id} </StyledVizTabsTab>;
        })}
      </StyledVizTabsTabs>
      <StateChartVisualization service={service} visible={!currentService} />

      {selectedService && (
        <StateChartVisualization service={selectedService} visible={true} />
      )}
    </div>
  );
};
