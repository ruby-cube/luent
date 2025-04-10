//@ts-nocheck
import { AnyObject } from "@rue/types";
import { Ion, ion } from "./ion";


// trafficLight.is('on') // reactive
// trafficLight.is(RED)

// trafficLight.on('change', () => {

// })

// trafficLight.can('change')

// trafficLight.$state
// trafficLight.$color

// trafficLight.change()


// $color.is('red')
// $color.on('change', () => {

// })


function to(state: string) {

}
// $color.change()


const $power = finiton('off', {
   'on': {
      'on:terminal': $ => { }, // when nested states have reached there terminal states
      toggle() { this.to('off') }
   },
   'off': {
      toggle() { this.to('on') }
   }
})


const $trafficLight = finiton('red', {
   'red': {
      'on:enter': $ => { this.onTimeout(() => $.change(), 500) },
      change() { this.to('green') },
   },
   'green': {
      'on:enter': $ => { this.onTimeout(() => $.change(), 700) },
      change() { this.to('yellow') },
   },
   'yellow': {
      change() { this.to('red') },
   }
   // 'disabled': {},
   // 'x:dead': {} // need to explicitly marke terminal state if these are merely methods
}, {
   init() { this.to('red') },
   disable() { this.to('disabled') },
   terminate() { this.to('dead') }
})

//QUESTION: when the transitions become methods, it doesn't make sense to have hooks anymore.
// - what happens if the method is async? Should we require transitions to be sync?
// - when do you call tasks? before or after you call the method? if you call it after, you have access to both prev and new states

// watch($power, ({ state }) => {
//    handleCase(state, {
//       on: () => $trafficLight.init()
//       ,
//       off: () => $trafficLight.terminate()
//    })
// })

// $power
//    .onEnter('on', () => $trafficLight.init())
//    .onExit('on', () => $trafficLight.terminate())

// $power.extend('on', $trafficLight)


// finiton existence
// - create
// - destroy

// finiton activity
// - activate
// - deactivate

// finiton state 
// - initial state
// - terminal state

$power.nest({
   'on': [
      $trafficLight.nest({
         'red': [$locomotion]
      }),
      $volume
   ],
   'off': [
      $hibernate
   ]
})

// nesting means nested state will be activated and deactivated based on the parents
// QUESTION: If a finiton reaches final state what does that mean for it's parent(s) and children?
// QUESTION: Can a finiton have more than one parent?
// 
$power.onEnterState({
   on: () => {
      $hibernate.machine.deactivate()
      $trafficLight.machine.activate()
   }
   ,
   off: () => {
      $trafficLight.machine.deactivate()
      $hibernate.machine.activate()
   }
})

$power.onDeactivated(() => {
   $hibernate.machine.deactivate()
   $trafficLight.machine.deactivate()
})

$power.onActivated(() => {
   $hibernate.machine.activate()
   $trafficLight.machine.activate()
})

$trafficLight.onTerminal(() =>
   $power.terminalize() //FIX: only when all nested finitons are terminalized and 
)


type FiniteStates = { [key: string]: StateConfig }

// type Transition = () => string | undefined | false | null | void

type StateConfig = {
   'on:enter'?: (finiton: Finiton) => void
   'on:exit'?: (finiton: Finiton) => void
   'on:terminal'?: (finiton: Finiton) => void
   // [STATE_HOOKS]?: {
   //    onEnter?: () => void | string
   //    onExit?: () => void | string
   // }
} & { [key: string]: Function }

type SharedTransitions = StateConfig & { 'on:terminal'?: (finiton: Finiton) => void }

type Finiton = {
   (): string
   is: (state: string) => boolean
   on: (transition: string, task: () => void) => void
   can: (transition: string) => boolean
   nest: (config: { [key: string]: Finiton[] }) => Finiton
   // onEnter: (state: string, task: () => void) => void
   // onExit: (state: string, task: () => void) => void
   // onEnterState: ((config: { [key: string]: () => void }) => void) | ((task: () => void) => void)
   // machine: {
   //    activate: () => void
   //    deactivate: () => void
   // }
   [ACTIVATE]: () => void
   [DEACTIVATE]: () => void
   [ON_TERMINAL]: (task: () => void) => void
} & { [key: string]: () => void }

export function finiton(initialState: string, states: FiniteStates, sharedTransitions: SharedTransitions) {
   const $currentState = ion(initialState);

   const $state = new Proxy($currentState, {
      get(target, key) {
         switch (key) {
            case 'is':
               return is;

            case 'on':
               return on;

            default:
               if (typeof key !== 'string') return (<AnyObject>target)[key];
               return useTransition(key)
         }
      },

      set(target, key) {
         return false;
      }
   }) as unknown as Finiton

   function is(state: string) {
      return $currentState() === state;
   }


   const transitionTasks = new Map()

   function on(transition: string, task: () => void) {
      const tasks = transitionTasks.get(transition) ?? new Set()
      tasks.add(task);
      transitionTasks.set(transition, tasks)
   }


   function performTransition(key: string, method: Function) {
      const output = method()
      const tasks = transitionTasks.get(key)
      if (tasks) {
         for (const task of tasks) {
            task()
         }
      }
      return transition();
   }

   function to(newStateID: string) {
      if (newStateID && newStateID in states) {
         const newState = states[newStateID]

         hooks.onExit?.()

         $currentState.state = newStateID;

         const { onEnter } = hooks
         const newerStateID = onEnter?.()
         // if (newerStateID && newerStateID !== newStateID) { } //TODO: 'always' transition
         // if (onTimeout) setTimeout(onTimeout[1], onTimeout[0]);
         if (isTerminal(newStateID)) sharedTransitions.onTerminated?.()
      }
   }

   function useTransition(key: string) {
      return getSavedTransition(key) ?? saveTransition(key, (...args) => {
         const state = states[$currentState()]
         const hooks = state[STATE_HOOKS] ?? extractHooks(state)
         if (key in state) {

         }
         //TODO: check any_state transitions

      })
   }

   const transitions = new Map()

   function getSavedTransition(key: string) {
      return transitions.get(key)
   }

   function saveTransition(key: string, transition: () => void) {
      transitions.set(key, transition)
      return transition
   }

   return $state;
}



function extractHooks(state: StateConfig) {
   const hooks = {
      onEnter: state.onEnter,
      onExit: state.onExit,
      onTimeout: state.onTimeout
   }
   delete state.onEnter
   delete state.onExit
   delete state.onTimeout
   //TODO: I need a better way to do this without modifying the original config obj.
   return hooks;
}