import { AnyObject } from "@rue/types";
import { Ion, ion } from "./ion";
import { debug } from "@rue/utils";


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



// $color.change()


// const $power = finiton('off', {
//    'on': {
//       toggle() { this.to('off') }
//    },
//    'off': {
//       toggle() { this.to('on') }
//    }
// })


// const $trafficLight = ion.finite('red', {
//    'red': {
//       // 'on:enter': $ => { this.onTimeout(500, () => $.change()) },
//       'after:500': () => 'green',
//       change: () => 'green',
//    },
//    'green': {
//       'on:enter': $ => { this.onTimeout(700, () => $.change()) },
//       change: () => 'yellow',
//    },
//    'yellow': {
//       change: () => 'red',
//    },
//    [ANY_STATE]: {

//    }
//    // 'disabled': {},
//    // 'x:dead': {} // need to explicitly marke terminal state if these are merely methods
// }, {
//    init() { this.to('red') },
//    disable() { this.to('disabled') },
//    terminate() { this.to('dead') },

//    change() {
//       this.cancelTimeout();
//       this.apply('change')
//    }
// })

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

// $power.nest({
//    'on': [
//       $trafficLight.nest({
//          'red': [$locomotion]
//       }),
//       $volume,
//       { onTerminalized: () => { } }
//    ],
//    'off': [
//       $hibernate
//    ]
// })

//TODO: nesting
//TODO: onTerminalized

// nesting means nested state will be activated and deactivated based on the parents
// QUESTION: If a finiton reaches final state what does that mean for it's parent(s) and children?
// QUESTION: Can a finiton have more than one parent?
// 
// $power.onEnterState({
//    on: () => {
//       $hibernate.machine.deactivate()
//       $trafficLight.machine.activate()
//    }
//    ,
//    off: () => {
//       $trafficLight.machine.deactivate()
//       $hibernate.machine.activate()
//    }
// })

// $power.onDeactivated(() => {
//    $hibernate.machine.deactivate()
//    $trafficLight.machine.deactivate()
// })

// $power.onActivated(() => {
//    $hibernate.machine.activate()
//    $trafficLight.machine.activate()
// })

// $trafficLight.onTerminal(() =>
//    $power.terminalize() //FIX: only when all nested finitons are terminalized and 
// )

export const ANY_STATE = Symbol('any_state')

type FiniteStates = { [key: string]: StateDefinition } & {
   [ANY_STATE]?: StateDefinition
}

type Transition = () => string | undefined | false | null | void


//TODO: should on:enter apply to intitial state?
type StateDefinition = {
   'on:enter'?: (this: Finiton) => void
   'on:exit'?: (this: Finiton) => void
   'after:enter'?: Transition
} & { [key: string | symbol]: Transition }


type Finiton<M extends Methods = {}> = {
   (): string
   is: (state: string) => boolean
   on: (transition: string, task: () => void) => void
   apply: (transition: string) => void
   can: (transition: string) => boolean
   nest: (config: { [key: string]: Finiton[] }) => Finiton
   onFinalState: (task: () => void) => void
   activate:()=>void
   deactivate:()=>void
} & M


type Methods = { [key: string | symbol]: (...args: unknown[]) => unknown }

type TransitionEvent = { state: string | undefined, prevState: string | undefined }

type Hooks = {
   onEnter: ((this: Finiton) => void) | undefined;
   onExit: ((this: Finiton) => void) | undefined;
   afterEnter: Transition | undefined
}

type NestedStates = { [key: string]: Finiton[] }

export function withTimeout(ms: number, transition: Transition) {
   //@ts-expect-error
   transition.timeout
      = ms;
   return transition;
}

export function finiton<M extends Methods>(initialState: string, states: FiniteStates, methods?: M): Finiton<M> {
   const $currentState = ion(undefined as undefined | string);

   let activated = false;

   const $state = new Proxy($currentState, {
      get(target, key) {
         return stateMachine[key as keyof typeof stateMachine] ?? (methods && methods[key])
      },

      set(target, key) {
         return false;
      }
   }) as unknown as Finiton

   const stateMachine = {
      is,
      apply,
      on,
      can,
      onFinalState,
      activate,
      deactivate,
      nest
   }

   let _nestedStates: NestedStates;

   function nest(nestedStates: NestedStates) {
      if (_nestedStates) {
         debug.error('Cannot redefine nested states')
         return;
      }
      _nestedStates = nestedStates;
      return $state;
   }

   function updateNestedStates(state: string, key: 'activate' | 'deactivate') {
      if (!_nestedStates) return;
      const nestedFinitons = _nestedStates[state];
      if (!nestedFinitons) return;
      for (const finiton of nestedFinitons) {
         finiton[key]()
      }
   }

   function activate() {
      if (activated) return;
      activated = true;
      $currentState.state = initialState;
      runEnterHooks(initialState, getHooks(ANY_STATE))
   }

   function deactivate() {
      if (!activated) return;
      activated = false;
      if (timeout) clearTimeout(timeout);
      const prevStateID = $currentState.state
      runExitHooks(prevStateID!, getHooks(ANY_STATE))
      $currentState.state = undefined;
   }

   function is(state: string) {
      return $currentState() === state;
   }

   const transitionTasks = new Map()

   function on(transition: string, task: (transitionEvent: TransitionEvent) => void) {
      const tasks = transitionTasks.get(transition) ?? new Set()
      tasks.add(task);
      transitionTasks.set(transition, tasks)
   }

   let finalized = false;

   function apply(transition: string) {
      if (!activated || finalized) return;
      if (timeout) clearTimeout(timeout);
      const transitionEvent = applyTransition(transition)
      if (transitionEvent) {
         runTransitionTasks(transition, transitionEvent)
         if (isTerminal(transitionEvent.state)) {
            finalized = true;
            runFinalTasks()
         }
      }
   }

   function runTransitionTasks(transition: string, transitionEvent: TransitionEvent) {
      const tasks = transitionTasks.get(transition)
      if (tasks) {
         for (const task of tasks) {
            task(transitionEvent)
         }
      }
   }

   // Final Tasks

   const finalTasks: Set<() => void> = new Set()

   function onFinalState(task: () => void) {
      finalTasks.add(task)
   }

   function runFinalTasks() {
      for (const task of finalTasks) {
         task()
      }
   }


   // Transitions

   const stateHooks: { [key: string | symbol]: Hooks } = {}

   function getHooks(key: keyof FiniteStates) {
      return stateHooks[key] ?? (stateHooks[key] = extractHooks(states[key] ?? {}))
   }

   function can(transition: string) {
      return Boolean(states[$currentState.state ?? ''][transition])
   }

   function applyTransition(transition: string | Transition) {
      const prevStateID = $currentState.state;
      const state = states[prevStateID ?? '']
      const getNextState = typeof transition === 'string' ? (state[transition] ?? states[ANY_STATE as any][transition]) : transition;
      if (!getNextState) return;

      const nextStateID = getNextState();
      if (!nextStateID) return;
      if (!(nextStateID in states)) //QUESTION: How to transition to nested or parent state?
         throw new Error('Invalid State')

      const anyStateHooks = getHooks(ANY_STATE)
      if (prevStateID) {
         runExitHooks(prevStateID, anyStateHooks) //TODO: should I pass the next state to the exit hook?
      }
      
      $currentState.state = nextStateID;
      
      runEnterHooks(nextStateID, anyStateHooks) //TODO: should I pass the prev state to the enter hook?

      return {
         state: nextStateID,
         prevState: prevStateID
      }
   }

   function runEnterHooks(stateID: string, anyStateHooks: Hooks) {
      const nextStateHooks = getHooks(stateID)

      nextStateHooks.onEnter?.apply($state)
      anyStateHooks.onEnter?.apply($state)

      setUpTimeout(nextStateHooks.afterEnter)
      setUpTimeout(anyStateHooks.afterEnter)

      updateNestedStates(stateID, 'activate')
   }

   function runExitHooks(stateID: string, anyStateHooks: Hooks) {
      getHooks(stateID).onExit?.apply($state)
      anyStateHooks.onExit?.apply($state)

      updateNestedStates(stateID, 'deactivate')
   }

   let timeout: any | undefined;

   function setUpTimeout(transition: undefined | { timeout?: number } & Transition) {
      if (!transition) return;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
         const transitionEvent = applyTransition(transition)
         if (transitionEvent && isTerminal(transitionEvent.state)) {
            runFinalTasks()
         }
      }, transition.timeout ?? 0)
   }

   return $state as Finiton<M>
}





function extractHooks(state: StateDefinition) {
   return {
      onEnter: state['on:enter'],
      onExit: state['on:exit'],
      afterEnter: state['after:enter']
   }
}

function isTerminal(state: string) {
   return state.startsWith('x:')
}