import { defineContextProp } from "../context/ContextKey"
import { contextual } from "../context/provide"
import { v } from "../InputTypes"

const PUSH_TRANSITION_NODE = Symbol('pushTransitionNode')

const pushTransitionNode = defineContextProp(PUSH_TRANSITION_NODE, v<(transitionNode: TransitionNode) => void>)

declare module '@rue/lumo' {
    interface ContextKeyMap {
        [PUSH_TRANSITION_NODE]: typeof pushTransitionNode
    }
}

export function registerTransitionNode(transitionNode: TransitionNode) {
    contextual(PUSH_TRANSITION_NODE)(transitionNode)
}

type TransitionNode = { transitionIn(endTransition: () => void): void, transitionOut(endTransition: (node: Node) => void): void }