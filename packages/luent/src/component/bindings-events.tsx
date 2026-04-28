import { AnyObject } from "@rue/types";
import { Component, ComponentTag, FromTag, RenderSlot } from "..";

function Grandparent() {

   return Component(
      <Parent on:click={() => console.log('grandparent click')}></Parent>
   )
}

function Parent(setup: any) {

   return Component(
      <Child on:click={() => console.log('parent click')} auto-bind={setup}></Child>
   )
}

function Child(setup: any) {

   return Component(
      <div on:click={() => console.log('child click')} auto-bind={setup}></div>
   )
}

function ChildA(setup: FromTag<'div'>) {

   const {
      styles,
      microclasses,
      emit, on: { click },
   } = setup

   return Component(
      <div microclass='' on:click={e => { console.log('child click'); emit(click, e) }} auto-bind={setup}></div>
   )
}

// a style-class 

function ChildB(setup: any) {

   return Component(
      <div on:click={() => console.log('child click')} {...setup}></div>
   )
}

// Setup types
// - requested setup
// - forwarded setup
//    - blind batch forward
//    - selective forward

// requested setup
// - mu: attributes (gather)
// - attributes
// - ref?: override
// - at:hook type

// selective forwarded setup (can be blind)
// - Slot: override (can be requested)

// blind batch forward
// - ** Slot: override (can be requested)
// - * ref: override
// - * hooks: queue (does it have to match ref? does it need to be typed? no...)

// - classes: combine (rename)
// - styleClasses: 
// - styles: cascade (rename)
// - transitions: ?
// - events: queue (unpack)





// ** must land in component
// * may land in component or element .. depending on whether component exposes a public instance

// Child
function makeComponent(Component: ComponentTag, fromTag: any) {
   const setup = toSetup(fromTag) // unless emit has been extracted and used for something else...

   const output = Component(setup)

   if (output.as) {
      const ref = composeRef(setup) // throw if ref already used
      const hooks = composeHooks(setup)
      if (ref) {

      }
      if (hooks) {

      }
   }
}

function makeElement(fromTag: any) {
   const { slots, ref, showIf, events, attributes, styles, classes, microclasses, hooks, transitions, mutables } = composeBindings(fromTag)
}

type RawBindings = {
   Slot: Function & {}
   // explicit bindings
   'mu:count': Function
   'start': number
   'at:mount': Function
   'class': string[]
   'microclass': string[]
   'style': {}[],
   'animate-in': []
   'show-if': Function,
   'on:click': Function,
   'ref': Function,

   // batch bindings
   'auto-bind'?: SetupBindings | undefined
}

type SetupBindings = { // FiniteBindingss
   emit: Function,
   microclasses: Function,
   classes: Function,
   styles: Function,
   on?: {}, // FiniteBindingss
   at?: {}, // FiniteBindingss
   mu?: {}, // FiniteBindingss
   Slot?: RenderSlot, // FiniteBindings
   ref?: Function,
   'auto-bind'?: SetupBindings | undefined
} & { [key: string]: any }  // attributes and namespace objects

type ComposedBindings = {
   events: EventBindings
   hooks: []
   attributes: []
}

type EventBindings = {
   click: Function[]
}

// component: raw bindings --> setup bindings
// element: raw bindings & nested setup bindings --> composed bindings

function FiniteBindings<T extends object>(target: T) {
   const keys = new Set<string | symbol>(Object.keys(target))

   return new Proxy(target, {
      get(target, key) {
         if (key === 'on' || key === 'mu')
            return target[key as keyof T]
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

function toSetup(bindings: RawBindings): SetupBindings {
   const setup = Object.create(null)
   const keys = Object.keys(bindings) as (keyof RawBindings)[]
   const Slot = bindings.Slot as AnyObject

   for (const rawKey of keys) {
      if (rawKey === 'auto-bind') continue;
      const { namespace, key } = analyzeKey(rawKey)
      processBinding(bindings, rawKey, namespace, key)
   }
   if (bindings['auto-bind']) setup['auto-bind'] = bindings['auto-bind']
   if (setup.on) setup.on = FiniteBindings(setup.on)
   if (setup.mu) setup.mu = FiniteBindings(setup.mu)

   function processBinding(bindings: RawBindings, rawKey: keyof RawBindings, namespace: string | undefined, key: string) {
      switch (namespace) {
         case 'on':
            const events = setup.on ?? (setup.on = Object.create(null))
            const handlers = events[key] ?? (events[key] = [])
            handlers.push(bindings[rawKey])
            break;

         case 'mu':
            const mutables = setup.mu ?? (setup.mu = Object.create(null))
            const mutable = bindings[rawKey]
            if (mutable) mutables[key] = mutable // overrides
            break;

         case 'at': // TODO: use symbol key to keep it internal?
            const hooks = setup.at ?? (setup.at = Object.create(null))
            const tasks = hooks[key] ?? (hooks[key] = [])
            tasks.push(bindings[rawKey])
            break;

         case 'Slot': // Named slots
            const render = bindings[rawKey]
            if (render) Slot[key] = render
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
   return FiniteBindings(setup)
}

// TODO: composed events
// <div on:event={[
//    tempo(e => { console.log('tempo')})
// ]}>

function analyzeKey(rawKey: string) {
   const strings = rawKey.split(':')
   if (strings.length > 2) throw new SyntaxError('attribute may not have more than one namespace')
   const namespaced = strings.length === 2
   const key = namespaced ? strings[1] : rawKey
   const namespace = namespaced ? strings[0] : undefined
   return { namespace, key }
}


function composeBindings(bindings: RawBindings) {
   const composed = Object.create(null)

   const keys = Object.keys(bindings) as (keyof RawBindings)[]

   for (const rawKey of keys) {
      if (rawKey === 'auto-bind') continue;
      const { namespace, key } = analyzeKey(rawKey)
      composeBinding(bindings, rawKey, namespace, key)
   }
   if (bindings['auto-bind']) composeForwarded(bindings['auto-bind'])

   function composeForwarded(bindings: SetupBindings) {
      const keys = Object.keys(bindings) as string[]
      for (const key of keys) {
         if (key === 'auto-bind' || key === 'emit') continue;

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

            case 'at':
               const hooks = bindings.at!
               const hookNames = Object.keys(hooks)
               for (const key of hookNames) {
                  composeBinding(hookNames, key, 'at', key)
               }
               break;

            case 'Slot':
               const slots = composed.slots = (composed.slots = [] as RenderSlot[])
               slots.push(bindings.Slot!)
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

         case 'at':
            const hooks = composed.hooks ?? (composed.hooks = Object.create(null))
            const tasks = hooks[key] ?? (hooks[key] = [])
            tasks.push(bindings[rawKey])
            break;

         case 'Slot': // Named slots
            const Slot = composed.Slot ?? (composed.Slot = bindings.Slot)
            Slot[key] = bindings[rawKey]
            break;

         default:
            composeAttributes(bindings, rawKey)
            break;
      }
   }

   function composeAttributes(bindings: { [key: string]: any }, key: string) {
      switch (key) {
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

function composeRef(setup: SetupBindings) {
   let ref = setup.ref
   let current: SetupBindings | undefined = setup
   while (current) {
      if (current.ref) ref = current.ref
      current = setup['auto-bind']
   }
   return ref
}

function composeHooks(setup: SetupBindings) {
   let composed;
   let current: SetupBindings | undefined = setup
   while (current) {
      if (current.at) {
         const hooks = current.at as AnyObject
         const keys = Object.keys(hooks)
         composed = composed ?? Object.create(null)
         for (const key of keys) {
            const tasks = composed[key] ?? (composed[key] = [])
            tasks.push(hooks[key])
         }
      }
      current = setup['auto-bind']
   }
   return composed
}

// child click
// parent click
// grandparent click