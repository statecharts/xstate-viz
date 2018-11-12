import React, { Component } from "react";
import * as XState from "xstate";
import { serializeEdge, isHidden, relative, center, Point } from "./utils";
import { tracker, TrackerData } from "./tracker";

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

    // const sourceRect = relative(
    //   elSource.getBoundingClientRect(),
    //   svgRef.getBoundingClientRect()
    // );
    const eventRect = relative(this.state.eventData!.rect!, svgRef);
    const targetRect = relative(this.state.targetData!.rect!, svgRef);

    const eventCenterPt = center(eventRect);
    const targetCenterPt = center(targetRect);

    const start = {
      x: eventRect.right - 4,
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
    let endSide: "left" | "top" | "bottom" | "right";
    const bezierPad = 10;

    if (edge.source === edge.target) {
      endSide = "right";
      end.y = start.y + 10;
      end.x = start.x;
    } else {
      if (eventCenterPt.x <= targetCenterPt.x) {
        if (m * targetRect.left + b < targetRect.top) {
          end.y = targetRect.top;
          end.x = (end.y - b) / m;
          endSide = "top";
        } else if (m * targetRect.left + b > targetRect.bottom) {
          end.y = targetRect.bottom;
          end.x = (end.y - b) / m;
          endSide = "bottom";
        } else {
          end.x = targetRect.left;
          end.y = m * end.x + b;
          endSide = "left";
        }
      } else {
        if (m * targetRect.right + b < targetRect.top) {
          end.y = targetRect.top;
          end.x = (end.y - b) / m;
          endSide = "top";
        } else if (m * targetRect.right + b > targetRect.bottom) {
          end.y = targetRect.bottom;
          end.x = (end.y - b) / m;
          endSide = "bottom";
        } else {
          end.x = targetRect.right - bezierPad;
          if (eventCenterPt.y > targetCenterPt.y) {
            end.y = targetRect.bottom;
            endSide = "bottom";
          } else {
            end.y = targetRect.top;
            endSide = "top";
          }
        }
      }
    }

    switch (endSide) {
      case "bottom":
        end.y += 4;
        break;
      case "top":
        end.y -= 4;
        break;
      case "left":
        end.x -= 4;
        break;
      case "right":
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
    const points: Point[] = [start, postStart];

    if (endSide === "top") {
      preEnd.y = preEnd.y - bezierPad;
    } else if (endSide === "bottom") {
      preEnd.y = preEnd.y + bezierPad;
    } else if (endSide === "left") {
      preEnd.y = end.y;
      preEnd.x = end.x - bezierPad;
    } else if (endSide === "right") {
      preEnd.y = end.y;
      preEnd.x = end.x + bezierPad;
    }

    points.push(preEnd);
    points.push(end);

    const path = points.reduce((acc, point, i) => {
      if (i === 0) {
        return `M ${point.x},${point.y}`;
      }

      if (i === points.length - 1) {
        return acc + ` L ${point.x},${point.y}`;
      }

      const prevPoint = points[i - 1];
      const nextPoint = points[i + 1];

      if (prevPoint.x === point.x || prevPoint.y === point.y) {
        return acc + ` L ${point.x},${point.y}`;
      }

      // return acc + ` L ${point.x},${point.y}`;

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

      return acc + ` Q ${point.x},${point.y} ${midpoint2.x},${midpoint2.y}`;
    }, "");

    const isHighlighted = this.props.preview;

    return (
      <g>
        <path
          d={path}
          stroke={isHighlighted ? "gray" : "var(--color-edge)"}
          strokeWidth={strokeWidth}
          fill="none"
          markerEnd={isHighlighted ? `url(#marker-preview)` : `url(#marker)`}
          ref={this.ref}
        />
      </g>
    );
  }
}
