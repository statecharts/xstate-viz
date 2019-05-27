import * as Xstate from "xstate";

export function toMachine(
  machine: Xstate.StateNode<any> | string
): Xstate.StateNode<any> {
  if (typeof machine !== "string") {
    return machine;
  }

  let createMachine: Function;

  try {
    createMachine = new Function(
      "Machine",
      "interpret",
      "assign",
      "XState",
      machine
    );
  } catch (e) {
    throw e;
  }

  let resultMachine: Xstate.StateNode<any>;

  const machineProxy = (config: any, options: any, ctx: any) => {
    resultMachine = Xstate.Machine(config, options, ctx);

    console.log(resultMachine);

    return resultMachine;
  };

  createMachine(machineProxy, Xstate.interpret, Xstate.assign, Xstate);

  return resultMachine! as Xstate.StateNode<any>;
}
