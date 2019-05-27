import React, { useState, useMemo } from 'react';
import { Interpreter } from 'xstate';
import { StateChartVisualization } from './StateChartVisualization';
import styled from 'styled-components';

interface VizTabsProps {
  service: Interpreter<any, any>;
}

const StyledVizTabsTabs = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-end;
`;

const StyledVizTabsTab = styled.li`
  border: 1px solid;
`;

export const VizTabs: React.SFC<VizTabsProps> = ({ service }) => {
  const [currentTab, setCurrentTab] = useState<string | undefined>();
  const childServices = useMemo(() => {
    return Array.from((service as any).children.values()).filter(
      (child): child is Interpreter<any, any> => child instanceof Interpreter
    );
  }, [(service as any).children.size]);
  const currentService = childServices.find(
    service => service.id === currentTab
  );

  return (
    <div>
      <StyledVizTabsTabs>
        {[service, ...childServices].map(s => {
          return (
            <StyledVizTabsTab key={s.id} onClick={() => setCurrentTab(s.id)}>
              {s.id}{' '}
            </StyledVizTabsTab>
          );
        })}
      </StyledVizTabsTabs>
      <StateChartVisualization service={service} />
      {currentService ? (
        <StateChartVisualization service={currentService} />
      ) : null}
    </div>
  );
};
