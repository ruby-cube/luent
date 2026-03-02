import { template } from "../component/Component"
import { FromTag, RenderSlot } from "../component/Input"
import { ContextKey } from "../context/ContextKey"
import { TransitionConfigs } from "./transitions"

let transitionConfig: TransitionConfigs | undefined

export function Transition({ Slot, ...attributes }: FromTag<{ Slot: RenderSlot }>) {
   transitionConfig = attributes
   const output = Slot()
   transitionConfig = undefined
   return template(output)
}

export function setTransition(transition: TransitionConfigs | undefined){
   transitionConfig = transition;
}

export function getTransition() {
   const transition = transitionConfig;
   transitionConfig = undefined
   return transition
}


const TRANSITIONS = ContextKey<TransitionConfigs>()