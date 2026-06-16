import { AnyObject } from "@rue/types"
import { FromTag, RenderSlot, WithRef } from "./x-Input"
import { NodeRef } from "../node/NodeRef"
import { NodeRefsConfig } from "../node/NodeRefs"
import { Ion, MutableIon } from "@rue/quarky"
import { TransitionConfigs } from "../transitions/transitions"
import { TagClass, TagStyle } from "../element/styles"
import { ComponentKit } from "@rue/nextscript"
import { RawJSXNode } from "../node/makeJSXNode"

// <div on:event={[
//    tempo(e => { console.log('tempo')})
// ]}>

type RawBindings = {
  Slot?: RenderSlot
  ref?: NodeRef | NodeRefsConfig,
  'auto-bind'?: SetupBindings | undefined
} & { [key: string]: any }

type SetupBindings = {
  microclasses?: Function,
  classes?: Function,
  styles?: Function,
  on?: EventBindings,
  at?: EventBindings,
  mu?: { [key: string]: MutableIon<unknown> | undefined },
  Slot?: RenderSlot, // FiniteBindings
  ref?: NodeRef | NodeRefsConfig,
  'auto-bind'?: SetupBindings | undefined
} & { [key: string | symbol]: any }  // attributes and namespace objects

type ComposedBindings = {
  events: EventBindings
  hooks: EventBindings
  attributes: { [key: string]: any }
  mutables: { [key: string]: any }
  microclasses?: TagClass,
  classes?: TagClass,
  styles?: TagStyle[],
  transitions?: TransitionConfigs
  showIf?: Ion<boolean>
  ref?: NodeRef | NodeRefsConfig,
  slots?: RenderSlot[]
}

type EventBindings = { [key: string]: EventListener[] }

// function FiniteBindings<T extends { Slot: RenderSlot | undefined }>(target: T, rest = false) {
//    const keys = new Set<string | symbol>(Object.keys(target))
//    if (rest) keys.add('rest')
//    return new Proxy(target, {
//       get(target, key) {
//          if (key === 'on' || key === 'mu')
//             return target[key as keyof T]
//          if (key === 'NamedSlot')
//             return target.Slot
//          keys.delete(key)
//          return target[key as keyof T]
//       },

//       set() {
//          return false;
//       },

//       ownKeys(target) {
//          return Array.from(keys)
//       },
//    })
// }

const MU = Symbol('mu')
const ON = Symbol('on')
const HOOKS = Symbol('hooks')

export function toSetup(bindings: RawBindings): SetupBindings {
  const setup = Object.create(null)
  const xray = setup.xray = Object.create(null)

  const keys = Object.keys(bindings) as string[]
  const Slot = bindings.Slot as AnyObject

  for (const rawKey of keys) {
    if (rawKey === 'auto-bind') continue;
    const { namespace, key } = analyzeKey(rawKey)
    processBinding(bindings, rawKey, namespace, key)
  }
  if (bindings['auto-bind']) setup['auto-bind'] = bindings['auto-bind']

  function processBinding(bindings: RawBindings, rawKey: keyof RawBindings, namespace: string | undefined, key: string) {
    switch (namespace) {
      case 'on':
        const events = setup[ON] ?? (setup[ON] = Object.create(null))
        events[key] = bindings[rawKey]
        break;

      case 'mu':
        const mutables = setup.mu ?? (setup.mu = Object.create(null))
        const internal = setup[MU] ?? (setup[MU] = Object.create(null))
        const mutable = bindings[rawKey]
        if (mutable) {
          setup[key] = internal[key] = mutables[key] = mutable
        }
        break;

      case 'at':
      case 'pre':
      case 'post':
        const hooks = setup[HOOKS] ?? (setup[HOOKS] = Object.create(null))
        hooks[rawKey] = bindings[rawKey]
        break;

      case 'Slot': // Named slots
        const render = bindings[rawKey]
        if (render) Slot[key] = render
        break;

      case 'xray':
        xray[key] = getXrayBindings(bindings[rawKey])
        break;

      case 'xlmns': // TODO: other namespaces?
      case undefined:
        setup[key] = bindings[rawKey]
        break;

      default:
        const ns = setup[namespace] ?? (setup[namespace] = Object.create(null))
        ns[key] = bindings[rawKey]
        break;
    }
  }
  return setup
}


function analyzeKey(rawKey: string) {
  const strings = rawKey.split(':')
  if (strings.length > 2) throw new SyntaxError('attribute may not have more than one namespace')
  const namespaced = strings.length === 2
  const key = namespaced ? strings[1] : rawKey
  const namespace = namespaced ? strings[0] : undefined
  return { namespace, key }
}


export function composeRef(setup: SetupBindings) {
  let ref = setup.ref
  let current: SetupBindings | undefined = setup
  while (current) {
    if (current.ref) ref = current.ref
    current = current['auto-bind']
  }
  return ref
}

export function composeHooks(setup: SetupBindings) {
  let composed;
  let hooked = false;
  let current: SetupBindings | undefined = setup
  while (current) {
    if (current[HOOKS]) {
      const hooks = current[HOOKS] as AnyObject
      const keys = Object.keys(hooks)
      composed = composed ?? Object.create(null)
      for (const key of keys) {
        if (!hooks[key]) continue;
        hooked = true;
        const tasks = composed[key] ?? (composed[key] = [])
        tasks.push(hooks[key])
      }
    }
    current = current['auto-bind']
  }
  return hooked ? composed : undefined
}


export function composeBindings(bindings: RawBindings): ComposedBindings {
  const composed = Object.create(null)

  const keys = Object.keys(bindings) as string[]

  for (const rawKey of keys) {
    if (rawKey === 'auto-bind') continue;
    const { namespace, key } = analyzeKey(rawKey)
    composeBinding(bindings, rawKey, namespace, key)
  }
  if (bindings['auto-bind']) composeForwarded(bindings['auto-bind'])

  function composeForwarded(bindings: SetupBindings) {
    const keys = Object.keys(bindings) as (string | typeof MU | typeof HOOKS | typeof ON)[]
    keys.push(MU, HOOKS, ON)
    for (const key of keys) {
      if (key === 'auto-bind' || key === 'xray' || key === 'Slot') continue;

      switch (key) {
        case ON:
          const events = bindings[ON]
          if (!events) break;
          const eventNames = Object.keys(events)
          for (const key of eventNames) {
            composeBinding(events, key, 'on', key)
          }
          break;

        case MU:
          const mutables = bindings[MU]
          if (!mutables) break;
          const attributes = Object.keys(mutables)
          for (const key of attributes) {
            composeBinding(attributes, key, 'mu', key)
          }
          break;

        case HOOKS:
          const hooks = bindings[HOOKS]
          if (!hooks) break;
          const hookNames = Object.keys(hooks)
          for (const key of hookNames) {
            composeBinding(hooks, key, 'hooks', key)
          }
          break;

        default:
          composeAttributes(bindings, key)
          break;
      }
    }
    if (bindings['auto-bind']) composeForwarded(bindings['auto-bind'])
  }

  function composeBinding(bindings: { [key: string]: any }, rawKey: string, type: string | undefined, key: string) {
    switch (type) {
      case 'on':
        if (!bindings[rawKey]) break;
        const events = composed.events ?? (composed.events = Object.create(null))
        const handlers = events[key] ?? (events[key] = [])
        handlers.push(bindings[rawKey])
        break;

      case 'mu':
        if (!bindings[rawKey]) break;
        const mutables = composed.mutables ?? (composed.mutables = Object.create(null))
        mutables[key] = bindings[rawKey]
        break;

      case 'at':
      case 'pre':
      case 'post':
      case 'hooks':
        if (!bindings[rawKey]) break;
        const hooks = composed.hooks ?? (composed.hooks = Object.create(null))
        const tasks = hooks[rawKey] ?? (hooks[rawKey] = [])
        tasks.push(bindings[rawKey])
        bindings[rawKey] = undefined // prevents hook being simultaneously registered on element and component
        break;

      case 'Slot': // Named slots
        const Slot = composed.Slot ?? (composed.Slot = bindings.NamedSlot) // FIX:
        Slot[key] = bindings[rawKey]
        break;

      default:
        composeAttributes(bindings, rawKey)
        break;
    }
  }

  function composeAttributes(bindings: { [key: string]: any }, key: string) {
    switch (key) {
      case 'Slot':
        const slots = composed.slots ?? (composed.slots = [])
        if (bindings.Slot) slots.push(bindings.Slot)
        break;

      case 'microclass':
        const microclasses = composed.microclasses ?? (composed.microclasses = []) 
        // TODO: use twMerge
        microclasses.push(bindings.microclass)
        break;

      case 'class':
        const classes = composed.classes ?? (composed.classes = [])
        if (bindings.class instanceof Array) {
          composed.classes = classes.concat(bindings.class)
        }
        else {
          classes.push(bindings.class)
        }
        break;

      case 'style':
        const styles = composed.styles ?? (composed.styles = [])
        if (bindings.style instanceof Array) {
          composed.styles = styles.concat(bindings.style)
        }
        else {
          styles.push(bindings.style)
        }
        break;

      case 'show-if':
        composed.showIf = bindings['show-if']
        break;

      default: // attributes
        const attributes = composed.attributes ?? (composed.attributes = Object.create(null))
        attributes[key] = bindings[key]
        break;
    }
  }

  return composed
}

// TODO: fix FromTag?
export type Xray<T> = (nested: { [key: string]: (setup: WithRef<'li'>) => ComponentKit }) => RawJSXNode

export function getXrayBindings(xray: (nested: { [key: string]: (setup: FromTag) => ComponentKit }) => { setup: AnyObject }) {
  return xray(new Proxy({}, {
    get() {
      return (setup: AnyObject) => {
        return ({ as: undefined, nodes: [], setup })
      }
    }
  })).setup
}