import React from 'react';
import * as XState from 'xstate';
import { StateChartNode } from './StateChartNode';
import { InitialEdge } from './InitialEdge';
import { Edge } from './Edge';
import { serializeEdge, isHidden, initialStateNodes } from './utils';

type VisualizerProps = {
  machine: XState.StateNode<any>;
  current: XState.State<any, any>;
  preview?: XState.State<any, any>;
  previewEvent?: string;
  onStateChartNodeReset: () => void;
  onStateChartNodeEvent: (event: string) => void;
  onStateChartNodePreEvent: (event: string) => void;
  onStateChartNodeExitPreEvent: () => void;
  toggledStates: Record<string, boolean>;
  edges: XState.Edge<any, XState.OmniEventObject<XState.EventObject>, string>[];
};

const svgRef = React.createRef<SVGSVGElement>();

export function Visualizer({
  machine,
  current,
  preview,
  previewEvent,
  onStateChartNodeReset,
  onStateChartNodeEvent,
  onStateChartNodePreEvent,
  onStateChartNodeExitPreEvent,
  toggledStates,
  edges
}: VisualizerProps) {
  return (
    <>
      <StateChartNode
        stateNode={machine}
        current={current}
        preview={preview}
        onReset={onStateChartNodeReset}
        onEvent={onStateChartNodeEvent}
        onPreEvent={onStateChartNodePreEvent}
        onExitPreEvent={onStateChartNodeExitPreEvent}
        toggledStates={toggledStates}
      />
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
        key={JSON.stringify(toggledStates)}
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
            <path d="M0,0 L0,4 L4,2 z" fill="gray" />
          </marker>
        </defs>
        {edges.map(edge => {
          if (!svgRef.current) {
            return;
          }

          // const svgRect = svgRef.current.getBoundingClientRect();

          return (
            <Edge
              key={serializeEdge(edge)}
              svg={svgRef.current}
              edge={edge}
              preview={
                edge.event === previewEvent &&
                current.matches(edge.source.path.join('.')) &&
                !!preview &&
                preview.matches(edge.target.path.join('.'))
              }
            />
          );
        })}
        {initialStateNodes(machine).map((initialStateNode, i) => {
          if (!svgRef.current) {
            return;
          }

          // const svgRect = svgRef.current.getBoundingClientRect();

          return (
            <InitialEdge
              key={`${initialStateNode.id}_${i}`}
              source={initialStateNode}
              svgRef={svgRef.current}
              preview={
                current.matches(initialStateNode.path.join('.')) ||
                (!!preview && preview.matches(initialStateNode.path.join('.')))
              }
            />
          );
        })}
      </svg>
    </>
  );
}
