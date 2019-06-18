import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getEdges } from 'xstate/lib/graph';
import { serializeEdge, initialStateNodes } from './utils';
import { Edge } from './Edge';
import { InitialEdge } from './InitialEdge';
import { StateChartNode } from './StateChartNode';
import { State, Interpreter } from 'xstate';
import { useService } from '@xstate/react';

const StyledVisualization = styled.div`
  position: relative;
  max-height: inherit;
  overflow-y: auto;
`;

export const StateChartVisualization: React.SFC<{
  service: Interpreter<any, any>;
  visible: boolean;
  onSelectService: (service: Interpreter<any>) => void;
}> = ({ service, visible, onSelectService }) => {
  const [transitionCount, setTransitionCount] = useState(0);
  const [current, send] = useService(service);
  const [state, setState] = React.useState<{
    [key: string]: any;
    preview?: State<any, any>;
  }>({
    toggledStates: {},
    previewEvent: undefined,
    preview: undefined
  });
  const svgRef = React.useRef<SVGSVGElement>(null);
  const edges = getEdges(service.machine);

  useEffect(() => {
    setTransitionCount(transitionCount + 1);
  }, [current]);

  if (!visible) {
    return null;
  }

  return (
    <StyledVisualization>
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          // @ts-ignore
          '--color': 'gray',
          overflow: 'visible',
          pointerEvents: 'none'
        }}
        ref={svgRef}
        key={JSON.stringify(state.toggledStates)}
      >
        <defs>
          <marker
            id="marker"
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            markerUnits="strokeWidth"
            orient="auto"
          >
            <path d="M0,0 L0,4 L4,2 z" fill="var(--color-edge)" />
          </marker>
          <marker
            id="marker-preview"
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            markerUnits="strokeWidth"
            orient="auto"
          >
            <path d="M0,0 L0,4 L4,2 z" fill="var(--color-edge-active)" />
          </marker>
        </defs>
        {edges.map(edge => {
          if (!svgRef.current) {
            return;
          }

          // const svgRect = this.svgRef.current.getBoundingClientRect();

          return (
            <Edge
              key={serializeEdge(edge)}
              svg={svgRef.current}
              edge={edge}
              preview={
                edge.event === state.previewEvent &&
                current.matches(edge.source.path.join('.')) &&
                !!state.preview &&
                state.preview.matches(edge.target.path.join('.'))
              }
            />
          );
        })}
        {initialStateNodes(service.machine).map((initialStateNode, i) => {
          if (!svgRef.current) {
            return;
          }

          return (
            <InitialEdge
              key={`${initialStateNode.id}_${i}`}
              source={initialStateNode}
              svgRef={svgRef.current}
              preview={
                current.matches(initialStateNode.path.join('.')) ||
                (!!state.preview &&
                  state.preview.matches(initialStateNode.path.join('.')))
              }
            />
          );
        })}
      </svg>
      <StateChartNode
        stateNode={service.machine}
        current={service.state}
        transitionCount={transitionCount}
        level={0}
        preview={state.preview}
        onReset={() => {}}
        onEvent={event => {
          send(event);
        }}
        onPreEvent={event => {
          if (!state.preview) {
            setState({
              ...state,
              preview: service.nextState(event),
              previewEvent: event
            });
          }
        }}
        onExitPreEvent={() => {
          setState({
            ...state,
            preview: undefined,
            previewEvent: undefined
          });
        }}
        onSelectServiceId={serviceId => {
          const s = (service as any).children.get(serviceId);

          if (s) {
            onSelectService(s); // TODO: pass service via context
          }
        }}
        toggledStates={state.toggledStates}
      />
    </StyledVisualization>
  );
};
