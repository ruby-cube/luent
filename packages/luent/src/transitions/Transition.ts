import { JSXComponent } from "@luent/nextscript"
import { RenderTag } from "../component/bindings-types"
import { ContextKey } from "../context/ContextKey"
import { TransitionConfigs } from "./transitions"
import { AnyObject } from "@luent/types"

let transitionConfig: TransitionConfigs | undefined

export function provideTransition(Slot: RenderTag, bindings: AnyObject) {
  try {
    transitionConfig = toTransitionConfig(bindings)
    return Slot()
  }
  finally {
    transitionConfig = undefined
  }
}

function toTransitionConfig(bindings: AnyObject): TransitionConfigs {
  const config = Object.create(null)
  for (const [key, value] of Object.entries(bindings)) {
    config[transformKey(key)] = value;
  }
  return config;
}

const keyMap = {
  'in': 'transition-in',
  'out': 'transition-out',
  'from': 'transition-from',
  'to': 'transition-to',
}

function transformKey(key: string) {
  if (key in keyMap) return keyMap[key as keyof typeof keyMap]
  return key;
}

export function setTransition(transition: TransitionConfigs | undefined) {
  transitionConfig = transition;
}

export function getTransition() {
  const transition = transitionConfig;
  transitionConfig = undefined
  return transition
}


const TRANSITIONS = ContextKey<TransitionConfigs>()