import { ReactiveSignal } from "@rue/muonic";
import { NodeEntity } from "../node/makeNode";
import { ConditionalKit } from "./ConditionalKit";
import { ListenOptions } from "net";
import { NodeSignal } from "../node/$Node";
import { Booleanny } from "@rue/types";


type ListenerLifespan = ListenOptions;

const THIS_NODE = 0 as const;
const CHILD_NODES = 1 as const;

type EventTarget = string | NodeSignal | Node | typeof THIS_NODE | typeof CHILD_NODES // query string

type EventTargetOptions = {
    targets: EventTarget[]
} | {
    excluded: EventTarget[]
}

type EventHandlerModifiers = {
    prevent?: true;
    stop?: true;
    end?: true;
}

type EventHandler<T> = T | [T, EventHandlerModifiers] | [T, EventTargetOptions] | [T, ListenerLifespan]
    | [T, EventHandlerModifiers, EventTargetOptions] | [T, EventTargetOptions, ListenerLifespan] | [T, EventHandlerModifiers, ListenerLifespan]
    | [T, EventHandlerModifiers, EventTargetOptions, ListenerLifespan]

type EventListenerValue<T> = T | ConditionalKit<T>[] | ConditionalKit<T>

export class ConditionalListenerKit extends ConditionalKit<EventHandler<EventListener>> {

    constructor(
        statementType: 'if' | 'elseIf' | 'else',
        public eventHandler: EventHandler<EventListener>,
        $condition?: ReactiveSignal<Booleanny>,
    ) {
        super(statementType, eventHandler, $condition)
    }
}