import { StateNode, TransitionDefinition } from "xstate";

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
    stateNode.ownEvents.map(event => {
      return stateNode.definition.on[event];
    })
  );
}

export function condToString(cond: string | Function) {
  if (typeof cond === "function") {
    console.log(cond.toString());
    return cond
      .toString()
      .replace(/\n/g, "")
      .match(/\{(.*)\}/)![1]
      .trim();
  }

  return cond;
}
