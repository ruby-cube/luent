import { AnyObject } from "@rue/types";
import { Component, ComponentTag, FromTag } from "..";

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
   const { Slot, ref, showIf, events, attributes, styles, classes, microclasses, hooks, transitions, mutables } = composeBindings(fromTag)
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

type SetupBindings = { // FiniteObjects
   emit: Function,
   case: Function,
   microclasses: Function,
   classes: Function,
   styles: Function,
   on?: {}, // FiniteObjects
   at?: {}, // FiniteObjects
   mu?: {}, // FiniteObjects
   Slot?: {}, // FiniteObjects
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

function FiniteObject<T extends object>(target: T) {
   const keys = new Set<string | symbol>(Object.keys(target))

   return new Proxy(target, {
      get(target, key) {
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
   if (setup.on) setup.on = FiniteObject(setup.on)
   if (setup.at) setup.at = FiniteObject(setup.at)
   if (setup.mu) setup.mu = FiniteObject(setup.mu)

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

         case 'at':
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
   return FiniteObject(setup)
}

// type ForwardedSetup = {
//    events: ForwardedEvents;
//    hooks: ForwardedHooks;
// } & {
//    'click': Function,
//    'ref': () => any
// }

// type ForwardedEvents = {
//    forwarded: ForwardedEvents
// } & {
//    [key: `on:${string}`]: Function
// }

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

   // const events = Object.create(null) // on:
   // const hooks = Object.create(null) // at:

   // const classes = []
   // const microclasses = []
   // const styles = []

   // const transitions = Object.create(null) // animate-in, transition-in, etc
   // const attributes = Object.create(null)
   // const mutables = Object.create(null) // mu:

   // let ref;
   // let showIf;
   // const Slot = bindings.Slot

   const keys = Object.keys(bindings)

   for (const rawKey of keys) {
      if (rawKey === 'auto-bind') continue;
      const { namespace, key } = analyzeKey(rawKey)
      composeBinding(bindings, rawKey, namespace, key)
   }
   if (bindings['auto-bind']) composeForwarded(bindings['auto-bind'])

   function composeForwarded(bindings: SetupBindings) {

   }

   function composeBinding(bindings: RawBindings, rawKey: string, namespace: string | undefined, key: string) {
      switch (namespace) {
         case 'on':
            const handlers = events[key] ?? (events[key] = [])
            handlers.push(bindings[key])
            break;

         case 'mu':
            const mutable = bindings[rawKey]
            if (mutable) mutables[key] = mutable // overrides
            break;

         case 'at':
            const handlers = hooks[key] ?? (hooks[key] = [])
            handlers.push(bindings[key])
            break;

         case 'Slot': // Named slots
            const render = bindings[rawKey]
            if (render) Slot[key] = render
            break;

         case 'xlmns': // TODO: others?
         case undefined:
            composeRawBinding(bindings, rawKey)
            break;

         default:
            // TODO: for components, we need to break namespace into object?
            break;
      }
   }

   function composeRawBinding(bindings: RawBindings, key: string) {
      switch (key) {
         case 'microclass':
            const microclasses = composed.microclasses ?? (composed.microclasses = [])
            microclasses.push(bindings.microclass)
            break;

         case 'class':
            const classes = composed.classes ?? (composed.classes = [])
            classes.push(bindings.class)
            break;

         case 'style':
            const classes = composed.styles ?? (composed.styles = [])
            classes.push(bindings.style)
            break;

         default: // attributes
            const attributes = composed.attributes ?? (composed.attributes = Object.create(null))
            attributes[key] = bindings[key]
            break;
      }
   }

   return composed
}

// child click
// parent click
// grandparent click