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
    const eventContainerRect = relative(
      this.state.eventData!.element!.parentElement!.getBoundingClientRect(),
      svgRef
    );
    const targetRect = relative(this.state.targetData!.rect!, svgRef);
    const magic = 10;
    const borderOffset = 5;

    const eventCenterPt = center(eventRect);
    const targetCenterPt = center(targetRect);

    const isSelf = edge.source === edge.target;
    const isInternal = edge.transition.internal;

    const ptFns: Array<(prevPt: Point) => Point> = [];

    if (isInternal) {
      ptFns.push(() => ({
        x: eventRect.left,
        y: eventCenterPt.y
      }));

      ptFns.push(prevPt => ({
        x: sourceRect.right,
        y: prevPt.y
      }));
      if (!isSelf) {
        ptFns.push(
          prevPt => ({
            x: targetRect.right,
            y: prevPt.y,
            color: 'green'
          }),
          () => ({
            x: targetRect.right - magic,
            y: targetRect.top - magic
          }),
          prevPt => ({
            x: prevPt.x,
            y: targetRect.top
          })
        );
      } else {
        ptFns.push(prevPt => {
          if (prevPt.y > sourceRect.bottom) {
            return {
              x: targetRect.right - magic,
              y: sourceRect.bottom
            };
          } else {
            return {
              x: targetRect.right,
              y: prevPt.y
            };
          }
        });
      }
    } else if (isSelf) {
      ptFns.push(
        () => ({
          x: sourceRect.right,
          y: Math.min(eventCenterPt.y, sourceRect.bottom)
        }),
        prevPt => ({
          x: eventRect.left,
          y: eventCenterPt.y
        }),
        prevPt => ({
          x: eventRect.right,
          y: eventCenterPt.y
        }),
        prevPt => ({
          x: eventRect.right + magic,
          y: eventRect.bottom
        }),
        prevPt => ({
          x: eventRect.right + magic * 2,
          y: eventCenterPt.y
        }),
        prevPt => ({
          x: eventRect.right + magic,
          y: eventRect.top
        }),
        prevPt => ({
          x: eventRect.right,
          y: eventCenterPt.y
        })
      );
    } else {
      // go through event label
      ptFns.push(
        () => ({
          x: sourceRect.right,
          y: Math.min(eventCenterPt.y, sourceRect.bottom)
        }),
        () => ({
          x: eventRect.left,
          y: eventCenterPt.y
        }),
        () => ({
          x: eventRect.left,
          y: eventCenterPt.y
        }),
        () => ({
          x: eventRect.right,
          y: eventCenterPt.y
        })
      );

      const startPt = {
        x: eventRect.right + magic,
        y: eventCenterPt.y
      };

      let endSide: 'left' | 'top' | 'bottom' | 'right';

      const endPtX =
        startPt.x < targetRect.right && startPt.x > targetRect.left
          ? startPt.x
          : Math.abs(eventRect.right - targetRect.left) <
            Math.abs(eventRect.right - targetRect.right)
          ? targetRect.left
          : targetRect.right;

      const dx = endPtX - startPt.x;

      const endPt = {
        x: endPtX,
        y:
          dx < 0
            ? targetRect.top
            : startPt.y < targetRect.bottom && startPt.y > targetRect.top
            ? startPt.y
            : Math.abs(eventContainerRect.bottom - targetRect.top) <
              Math.abs(eventContainerRect.bottom - targetRect.bottom)
            ? targetRect.top
            : targetRect.bottom
      };

      const dy = endPt.y - startPt.y;

      if (endPt.y === targetRect.top) {
        endPt.y -= borderOffset;
        endSide = 'top';
        if (endPt.x === targetRect.right) {
          endPt.x -= magic;
        } else if (endPt.x === targetRect.left) {
          endPt.x += magic;
        }
      } else if (endPt.y === targetRect.bottom) {
        endPt.y += borderOffset;
        endSide = 'bottom';

        if (endPt.x === targetRect.right) {
          endPt.x -= magic;
        } else if (endPt.x === targetRect.left) {
          endPt.x += magic;
        }
      } else {
        if (endPt.x === targetRect.right) {
          endPt.y = targetRect.top;
          endSide = 'top';
        } else {
          endPt.x -= borderOffset;
          endSide = 'left';
        }
      }

      const slope = dy / dx;

      const xDir = Math.sign(dx);
      const yDir = Math.sign(dy);

      ptFns.push(() => startPt);

      if (xDir === -1) {
        if (yDir === -1) {
          ptFns.push(prevPt => ({
            x: prevPt.x,
            y: Math.min(sourceRect.top - magic, targetRect.top - magic)
          }));
        } else {
          // ptFns.push(prevPt => ({
          //   x: prevPt.x,
          //   y: Math.max(
          //     startPt.y + magic,
          //     sourceRect.bottom,
          //     eventContainerRect.bottom
          //   )
          // }));

          if (sourceRect.bottom > startPt.y + magic) {
            ptFns.push(prevPt => ({
              x: prevPt.x,
              y: Math.min(sourceRect.bottom + magic, endPt.y - magic)
            }));
            ptFns.push(prevPt => ({
              x: prevPt.x + magic * xDir,
              y: prevPt.y
            }));
          } else {
            ptFns.push(prevPt => ({
              x: prevPt.x,
              y: Math.min(eventContainerRect.bottom + magic, endPt.y - magic)
            }));
          }
        }
      }

      if (endSide === 'top') {
        ptFns.push(() => ({
          x: endPt.x,
          y: endPt.y - magic
        }));
      } else if (endSide === 'bottom') {
        ptFns.push(() => ({
          x: endPt.x,
          y: endPt.y + magic
        }));
      }

      ptFns.push(() => endPt, () => endPt);
    }
    const pts = ptFns.reduce(
      (acc, ptFn, i) => {
        acc.push(ptFn(acc[i - 1] || acc[0]));
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
        return acc;
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
        },${midpoint2.y} `
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
        {process.env.NODE_ENV === 'development'
          ? circles.map((circle, i) => {
              const fill = i > pts.length ? 'red' : 'blue';
              return (
                <circle
                  key={i}
                  cx={circle.x}
                  cy={circle.y}
                  r={i > pts.length ? 0.5 : 1}
                  fill={circle.color || fill}
                >
                  <text>{i}</text>
                </circle>
              );
            })
          : null}
      </g>
    );
  }
}
