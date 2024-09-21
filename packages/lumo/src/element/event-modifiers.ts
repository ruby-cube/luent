import { ListenOptions } from "net";
import { NodeIon } from "../node/$Node";

type ListenerLifespan = ListenOptions;

const THIS_NODE = 0 as const;
const CHILD_NODES = 1 as const;

type EventTarget = string | NodeIon | Node | typeof THIS_NODE | typeof CHILD_NODES // query string

type EventHandlerModifiers = {
    prevent?: true;
    stop?: true;
    end?: true;
}


export function target(...targets: EventTarget[]) {
    return {
        targets,
    }
}

export function exclude(...nodes: EventTarget[]) {
    return {
        excluded: nodes
    }
}

const preventDefault_stopPropagation = {
    prevent: true,
    stop: true
} as const

const preventDefault_endHere = {
    prevent: true,
    end: true
} as const


export const preventDefault = {
    stopPropagation: preventDefault_stopPropagation,
    endHere: preventDefault_endHere,
    prevent: true,
} as const

export const stopPropagation = {
    preventDefault: preventDefault_stopPropagation,
    stop: true
} as const

export const endHere = {
    preventDefault: preventDefault_endHere,
    end: true
} as const

