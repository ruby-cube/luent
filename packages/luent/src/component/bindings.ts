import { AnyObject } from "@rue/types"
import { FromTag, MaybeIon, RenderSlot } from "./x-Input"
import { NodeRef } from "../node/NodeRef"
import { NodeRefsConfig } from "../node/NodeRefs"
import { Ion } from "@rue/quarky"
import { TransitionConfigs } from "../transitions/transitions"
import { ClassInput, StyleInput } from "../element/styles"
import { ComponentKit } from "@rue/ruescript"
import { RawJSXNode } from "../node/makeJSXNode"

// <div on:event={[
//    tempo(e => { console.log('tempo')})
// ]}>

type RawBindings = {
   Slot?: RenderSlot
   ref?: NodeRef | NodeRefsConfig,
   'auto-bind'?: SetupBindings | undefined
} & { [key: string]: any }

type SetupBindings = { // FiniteBindingss
   emit: Function,
   microclasses?: Function,
   classes?: Function,
   styles?: Function,
   on?: EventBindings, // FiniteBindingss
   at?: EventBindings, // FiniteBindingss
   mu?: { [key: string]: Ion<unknown> }, // FiniteBindingss
   Slot?: RenderSlot, // FiniteBindings
   ref?: NodeRef | NodeRefsConfig,
   'auto-bind'?: SetupBindings | undefined
} & { [key: string]: any }  // attributes and namespace objects

type ComposedBindings = {
   events: EventBindings
   hooks: EventBindings
   attributes: { [key: string]: any }
   mutables: { [key: string]: any }
   microclasses?: ClassInput,
   classes?: ClassInput,
   styles?: StyleInput[],
   transitions?: TransitionConfigs
   showIf?: Ion<boolean>
   ref?: NodeRef | NodeRefsConfig,
   slots?: RenderSlot[]
}

type EventBindings = { [key: string]: EventListener[] }

function FiniteBindings<T extends { Slot: RenderSlot | undefined }>(target: T, rest = false) {
   const keys = new Set<string | symbol>(Object.keys(target))
   if (rest) keys.add('rest')
   return new Proxy(target, {
      get(target, key) {
         if (key === 'on' || key === 'mu')
            return target[key as keyof T]
         if (key === 'NamedSlot')
            return target.Slot
         keys.delete(key)
         return target[key as keyof T]
      },

      set() {
         return false;
      },

      ownKeys(target) {
         return Array.from(keys)
      },
   })
}

export function toSetup(bindings: RawBindings): SetupBindings {
   const setup = Object.create(null)
   const xray = setup.xray = Object.create(null)
   let rest: SetupBindings;

   Object.defineProperty(setup, 'rest', {
      get() {
         return rest ?? (rest = { ...setup, on: { ...setup.on }, mu: { ...setup.mu } })
      }
   })

   const keys = Object.keys(bindings) as string[]
   const Slot = bindings.Slot as AnyObject

   for (const rawKey of keys) {
      if (rawKey === 'auto-bind') continue;
      const { namespace, key } = analyzeKey(rawKey)
      processBinding(bindings, rawKey, namespace, key)
   }
   if (bindings['auto-bind']) setup['auto-bind'] = bindings['auto-bind']
   if (setup.on) {
      setup.on = FiniteBindings(setup.on)
      setup.emit = (event: EventListener, eventInfo: Event) => {
         event(eventInfo)
      }
   }
   if (setup.mu) setup.mu = FiniteBindings(setup.mu)

   function processBinding(bindings: RawBindings, rawKey: keyof RawBindings, namespace: string | undefined, key: string) {
      switch (namespace) {
         case 'on':
            const events = setup.on ?? (setup.on = Object.create(null))
            events[key] = bindings[rawKey]
            break;

         case 'mu':
            const mutables = setup.mu ?? (setup.mu = Object.create(null))
            const mutable = bindings[rawKey]
            if (mutable) mutables[key] = mutable // overrides
            break;

         case 'at': // TODO: use symbol key to keep it internal?
         case 'after': // TODO: use symbol key to keep it internal?
            const hooks = setup.hooks ?? (setup.hooks = Object.create(null))
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
   return FiniteBindings(setup, true)
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
   let current: SetupBindings | undefined = setup
   while (current) {
      if (current.hooks) {
         const hooks = current.hooks as AnyObject
         const keys = Object.keys(hooks)
         composed = composed ?? Object.create(null)
         for (const key of keys) {
            const tasks = composed[key] ?? (composed[key] = [])
            tasks.push(hooks[key])
         }
      }
      current = current['auto-bind']
   }
   return composed
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
      const keys = Object.keys(bindings) as string[]
      for (const key of keys) {
         if (key === 'auto-bind' || key === 'emit' || key === 'rest') continue;

         switch (key) {
            case 'on':
               const events = bindings.on!
               const eventNames = Object.keys(events)
               for (const key of eventNames) {
                  composeBinding(events, key, 'on', key)
               }
               break;

            case 'mu':
               const mutables = bindings.mu!
               const attributes = Object.keys(mutables)
               for (const key of attributes) {
                  composeBinding(attributes, key, 'mu', key)
               }
               break;

            case 'hooks':
               const hooks = bindings.hooks!
               const hookNames = Object.keys(hooks)
               for (const key of hookNames) {
                  composeBinding(hookNames, key, 'hooks', key)
               }
               break;

            case 'Slot':
               console.warn('Cannot auto-bind Slot. Slots must be registered through manual binding.')
               break;

            default:
               composeAttributes(bindings, key)
               break;
         }
      }
      if (bindings['auto-bind']) composeForwarded(bindings['auto-bind'])
   }

   function composeBinding(bindings: { [key: string]: any }, rawKey: string, namespace: string | undefined, key: string) {
      switch (namespace) {
         case 'on':
            const events = composed.events ?? (composed.events = Object.create(null))
            const handlers = events[key] ?? (events[key] = [])
            handlers.push(bindings[rawKey])
            break;

         case 'mu':
            const mutables = composed.mutables ?? (composed.mutables = Object.create(null))
            mutables[key] = bindings[rawKey]
            break;

         case 'hooks':
            const hooks = composed.hooks ?? (composed.hooks = Object.create(null))
            const tasks = hooks[key] ?? (hooks[key] = [])
            tasks.push(bindings[rawKey])
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
            const microclasses = composed.microclasses ?? (composed.microclasses = []) // TODO: use twMerge
            microclasses.push(bindings.microclass)
            break;

         case 'class':
            const classes = composed.classes ?? (composed.classes = [])
            classes.push(bindings.class)
            break;

         case 'style':
            const styles = composed.styles ?? (composed.styles = [])
            styles.push(bindings.style)
            break;


         default: // attributes
            const attributes = composed.attributes ?? (composed.attributes = Object.create(null))
            attributes[key] = bindings[key]
            break;
      }
   }

   return composed
}

export type Xray<T> = (nested: { [key: string]: (setup: FromTag<T>) => ComponentKit }) => RawJSXNode

export function getXrayBindings(xray: (nested: { [key: string]: (setup: FromTag) => ComponentKit }) => { setup: AnyObject }) {
   return xray(new Proxy({}, {
      get() {
         return (setup: AnyObject) => {
            return ({ as: undefined, nodes: [], setup })
         }
      }
   })).setup
}