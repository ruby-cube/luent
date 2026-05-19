import { JSXComponent } from "@rue/nextscript"
import { FromTag, RenderSlot } from "../component/x-Input"
import { ContextKey } from "../context/ContextKey"
import { TransitionConfigs } from "./transitions"

let transitionConfig: TransitionConfigs | undefined

export function Transition({ Slot, ...attributes }: FromTag<{ Slot: RenderSlot }>) {
   transitionConfig = attributes
   const output = Slot()
   transitionConfig = undefined
   return JSXComponent(output)
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