import { JSXComponent } from "@rue/nextscript"
import { RenderSlot } from "../component/x-Input"
import { ContextKey } from "../context/ContextKey"
import { TransitionConfigs } from "./transitions"
import { AnyObject } from "@rue/types"

let transitionConfig: TransitionConfigs | undefined

export function provideTransition(Slot: RenderSlot, bindings: AnyObject) {
  // TODO: make transition-in-out the default
  try{
    transitionConfig = bindings
    console.log('@@@ transition config', bindings)
    return Slot()
  }
  finally{
    transitionConfig = undefined
  }
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