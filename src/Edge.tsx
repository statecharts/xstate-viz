import React, { Component } from 'react';
import * as XState from 'xstate';
import { serializeEdge, isHidden, relative, center, Point } from './utils';
import { tracker, TrackerData } from './tracker';

interface EdgeProps {
  edge: XState.Edge<any, any>;
  preview: boolean;
  svg: SVGSVGElement;
}

interface EdgeState {
  eventElement: Element | null;
  sourceElement: Element | null;
  targetElement: Element | null;
  sourceData: TrackerData | undefined;
  targetData: TrackerData | undefined;
  eventData: TrackerData | undefined;
}

function maybeGet<T, R>(
  value: T | undefined,
  getter: (value: T) => R
): R | undefined {
  return value ? getter(value) : undefined;
}

export class Edge extends Component<EdgeProps, EdgeState> {
  state = {
    eventElement: null,
    sourceElement: null,
    targetElement: null,
    sourceData: tracker.get(this.props.edge.source.id),
    targetData: tracker.get(this.props.edge.target.id),
    eventData: tracker.get(serializeEdge(this.props.edge))
  };
  ref = React.createRef<SVGPathElement>();
  componentDidMount() {
    const { edge } = this.props;
    const eventId = serializeEdge(edge);

    tracker.listen(eventId, data => {
      this.setState({ eventData: data });
    });

    tracker.listen(edge.source.id, data => {
      this.setState({ sourceData: data });
    });

    tracker.listen(edge.target.id, data => {
      let target = edge.target;
      let parentData: TrackerData | undefined = data;

      while (isHidden(parentData.element)) {
        if (!target.parent) {
          break;
        }
        target = target.parent;
        parentData = tracker.get(target.id);

        if (!parentData) {
          break;
        }
      }

      this.setState({ targetData: parentData || undefined });
    });
  }
  render() {
    const { edge } = this.props;
    const { sourceData, eventData, targetData } = this.state;

    if (
      !sourceData ||
      sourceData.hidden ||
      !eventData ||
      eventData.hidden ||
      !targetData ||
      targetData.hidden
    ) {
      return null;
    }

    const strokeWidth = 2;
    const svgRef = this.props.svg;

    const sourceRect = relative(this.state.sourceData!.rect!, svgRef);
    const eventRect = relative(this.state.eventData!.rect!, svgRef);
    const targetRect = relative(this.state.targetData!.rect!, svgRef);
    const magic = eventRect.height / 2;

    const eventCenterPt = center(eventRect);
    const targetCenterPt = center(targetRect);

    const ptFns: Array<(prevPt: Point) => Point> = [
      () => ({
        x: sourceRect.right,
        y: Math.min(eventCenterPt.y, sourceRect.bottom)
      }),
      () => ({
        x: eventRect.left,
        y: eventCenterPt.y
      })
    ];

    const startPt = {
      x: eventRect.right + magic,
      y: eventCenterPt.y
    };

    const isSelf = edge.source === edge.target;

    const endPt = isSelf
      ? {
          x: eventRect.right,
          y: eventRect.top
        }
      : {
          x:
            Math.abs(eventRect.right - targetRect.left) <
            Math.abs(eventRect.right - targetRect.right)
              ? targetRect.left
              : targetRect.right,
          y:
            Math.abs(eventRect.bottom - targetRect.top) <
            Math.abs(eventRect.bottom - targetRect.bottom)
              ? targetRect.top
              : targetRect.bottom
        };

    if (!isSelf) {
      endPt.x =
        startPt.x < targetRect.right && startPt.x > targetRect.left
          ? startPt.x
          : endPt.x;
      endPt.y =
        startPt.y < targetRect.bottom && startPt.y > targetRect.top
          ? startPt.y
          : endPt.y;
    }

    const xDir = Math.sign(endPt.x - startPt.x);
    const yDir = Math.sign(endPt.y - startPt.y);

    ptFns.push(() => startPt);

    if (xDir === -1 && Math.abs(startPt.y - endPt.y) < magic) {
      ptFns.push(prevPt => ({
        x: startPt.x,
        y: startPt.y - magic
      }));

      ptFns.push(prevPt => ({
        x: eventRect.left,
        y: prevPt.y
      }));
    }

    if (!isSelf) {
      const midPts = [
        {
          x: startPt.x,
          y: startPt.y + magic * yDir
        },
        {
          x: endPt.x,
          y: endPt.y - magic * yDir
        }
      ];

      ptFns.push(...midPts.map(pt => () => pt));
    } else {
      ptFns.push(prevPt => ({
        x: prevPt.x,
        y: endPt.y
      }));
    }

    if (endPt.y === targetRect.top) {
      ptFns.push(() => ({
        x: endPt.x,
        y: endPt.y - magic
      }));
    } else if (endPt) ptFns.push(() => endPt);

    const preStart = [
      {
        x: sourceRect.right,
        y: Math.min(eventCenterPt.y, sourceRect.bottom)
      },
      {
        x: eventRect.left,
        y: eventCenterPt.y
      }
    ];

    const start = {
      x: eventRect.right,
      y: eventCenterPt.y
    };

    const end = {
      x: 0,
      y: 0
    };

    let m =
      (targetCenterPt.y - eventCenterPt.y) /
      (targetCenterPt.x - eventCenterPt.x);
    let b = eventCenterPt.y - m * eventCenterPt.x;
    let endSide: 'left' | 'top' | 'bottom' | 'right';
    const bezierPad = magic;

    if (edge.source === edge.target) {
      endSide = 'right';
      end.y = start.y + 10;
      end.x = start.x;
    } else {
      if (eventCenterPt.x <= targetCenterPt.x) {
        if (m * targetRect.left + b < targetRect.top) {
          end.y = targetRect.top;
          end.x = (end.y - b) / m;
          endSide = 'top';
        } else if (m * targetRect.left + b > targetRect.bottom) {
          end.y = targetRect.bottom;
          end.x = (end.y - b) / m;
          endSide = 'bottom';
        } else {
          end.x = targetRect.left;
          end.y = m * end.x + b;
          endSide = 'left';
        }
      } else {
        if (m * targetRect.right + b < targetRect.top) {
          end.y = targetRect.top;
          end.x = (end.y - b) / m;
          endSide = 'top';
        } else if (m * targetRect.right + b > targetRect.bottom) {
          end.y = targetRect.bottom;
          end.x = (end.y - b) / m;
          endSide = 'bottom';
        } else {
          end.x = targetRect.right - bezierPad;
          if (eventCenterPt.y > targetCenterPt.y) {
            end.y = targetRect.bottom;
            endSide = 'bottom';
          } else {
            end.y = targetRect.top;
            endSide = 'top';
          }
        }
      }
    }

    switch (endSide) {
      case 'bottom':
        end.y += 4;
        break;
      case 'top':
        end.y -= 4;
        break;
      case 'left':
        end.x -= 4;
        break;
      case 'right':
        end.x += 4;
        break;
    }

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const preEnd = { ...end };
    const postStart = {
      x: start.x + bezierPad,
      y:
        Math.abs(dy) > bezierPad
          ? start.x > end.x
            ? dy > 0
              ? start.y + bezierPad
              : start.y - bezierPad
            : start.y + bezierPad
          : start.y
    };
    const points: Point[] = [...preStart, start, postStart];

    if (endSide === 'top') {
      preEnd.y = preEnd.y - bezierPad;
    } else if (endSide === 'bottom') {
      preEnd.y = preEnd.y + bezierPad;
    } else if (endSide === 'left') {
      preEnd.y = end.y;
      preEnd.x = end.x - bezierPad;
    } else if (endSide === 'right') {
      preEnd.y = end.y;
      preEnd.x = end.x + bezierPad;
    }

    points.push({
      x: start.x,
      y: start.y + Math.abs(start.y - end.y) / 2
    });

    points.push({
      x: end.x,
      y: start.y + Math.abs(start.y - end.y) / 2
    });

    points.push(preEnd);
    points.push(end);

    const pts = ptFns.reduce(
      (acc, ptFn, i) => {
        acc.push(ptFn(acc[i - 1] || startPt));
        return acc;
      },
      [] as Point[]
    );

    const circles: Point[] = pts.slice();

    const path = pts.reduce((acc, point, i) => {
      if (i === 0) {
        return `M ${point.x},${point.y}`;
      }

      if (i === pts.length - 1) {
        return acc + ` L ${point.x},${point.y}`;
      }

      const prevPoint = pts[i - 1];
      const nextPoint = pts[i + 1];

      const dx = point.x - prevPoint.x;
      const dy = point.y - prevPoint.y;
      const nextDx = nextPoint.x - point.x;
      const nextDy = nextPoint.y - point.y;

      const midpoint1 = {
        x: prevPoint.x + dx / 2,
        y: prevPoint.y + dy / 2
      };
      const midpoint2 = {
        x: point.x + nextDx / 2,
        y: point.y + nextDy / 2
      };

      circles.push(midpoint1, midpoint2);

      return (
        // acc + `L ${midpoint1.x},${midpoint1.y} L ${midpoint2.x},${midpoint2.y}`
        acc +
        `L ${midpoint1.x},${midpoint1.y} Q ${point.x},${point.y} ${
          midpoint2.x
        },${midpoint2.y}`
      );
    }, '');

    const isHighlighted = this.props.preview;

    return (
      <g>
        <path
          d={path}
          stroke={
            isHighlighted ? 'var(--color-edge-active)' : 'var(--color-edge)'
          }
          strokeWidth={strokeWidth}
          fill="none"
          markerEnd={isHighlighted ? `url(#marker-preview)` : `url(#marker)`}
          ref={this.ref}
        />
        {circles.map((circle, i) => {
          const fill = i > pts.length ? 'red' : 'blue';
          return <circle cx={circle.x} cy={circle.y} r={2} fill={fill} />;
        })}
      </g>
    );
  }
}
