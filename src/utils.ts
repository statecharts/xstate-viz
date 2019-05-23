import {
  StateNode,
  TransitionDefinition,
  Edge,
  Action,
  ActionObject,
  Guard
} from 'xstate';

export function isChildOf(
  childState: StateNode,
  parentState: StateNode
): boolean {
  let marker = childState;

  while (marker.parent && marker.parent !== parentState) {
    marker = marker.parent;
  }

  return marker === parentState;
}

export function flatten<T>(array: T[][]): T[] {
  return ([] as T[]).concat(...array);
}

export function transitions(
  stateNode: StateNode
): TransitionDefinition<any, any>[] {
  return flatten(
    stateNode.ownEvents.map((event: string) => {
      return stateNode.definition.on[event];
    })
  );
}

export function condToString(cond: Guard<any, any>) {
  return cond.type;
  // if (typeof cond === "function") {
  //   return cond.toString();
  //   // return cond
  //   //   .toString()
  //   //   .replace(/\n/g, "")
  //   //   .match(/\{(.*)\}/)![1]
  //   //   .trim();
  // }

  // return cond;
}

const DELAY_EVENT_REGEX = /^xstate\.after\((.+)\)#/;

export function friendlyEventName(event: string) {
  let match = event.match(DELAY_EVENT_REGEX);

  if (match) {
    const isMs = Number.isFinite(+match[1]);
    return `after ${match[1]}${isMs ? 'ms' : ''}`;
  }

  match = event.match(/^done\.state/);

  if (match) {
    return `done`;
  }

  if (event === '') {
    return 'transient';
  }

  return event;
}

export function getEventDelay(event: string): string | number | false {
  let match = event.match(DELAY_EVENT_REGEX);

  if (match) {
    return Number.isFinite(+match[1]) ? +match[1] : match[1];
  }

  return false;
}

export function serializeEdge(edge: Edge<any, any>): string {
  const cond = edge.cond ? `[${edge.cond.toString().replace(/\n/g, '')}]` : '';
  return `${edge.source.id}:${edge.event}${cond}->${edge.target.id}`;
}

export function isHidden(el?: Element | null): el is null {
  if (!el) {
    return true;
  }
  const rect = el.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
    return true;
  }

  return false;
}

export function relative(
  childRect: ClientRect,
  parentElement: Element
): ClientRect {
  const parentRect = parentElement.getBoundingClientRect();

  return {
    top: childRect.top - parentRect.top,
    right: childRect.right - parentRect.left,
    bottom: childRect.bottom - parentRect.top,
    left: childRect.left - parentRect.left,
    width: childRect.width,
    height: childRect.height
  };
}

export function initialStateNodes(stateNode: StateNode): StateNode[] {
  const stateKeys = Object.keys(stateNode.states);

  return stateNode.initialStateNodes.concat(
    flatten(
      stateKeys.map(key => {
        const childStateNode = stateNode.states[key];
        if (
          childStateNode.type === 'compound' ||
          childStateNode.type === 'parallel'
        ) {
          return initialStateNodes(stateNode.states[key]);
        }

        return [];
      })
    )
  );
}

export function stateActions(stateNode: StateNode): ActionObject<any, any>[] {
  return stateNode.onEntry.concat(stateNode.onExit);
}

export interface Point {
  x: number;
  y: number;
}

export function center(rect: ClientRect): Point {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
