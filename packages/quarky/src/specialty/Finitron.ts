import { createStack, debug } from "@rue/utils";
import { Ion } from "../ion/Ion";
import { watch } from "../reactivity/Watcher";
import { QUARK } from "../abstract/Quark";
import { AnyObject, UnionToIntersection } from "@rue/types";
import { untracked } from "../reactivity/Compound";
import { getActiveUpdate } from "../reactivity/Update";
import { PRELUDE, queueTask } from "../reactivity/RenderCycle";


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


// const $power = finitron('off', {
//    'on': {
//       toggle() { this.to('off') }
//    },
//    'off': {
//       toggle() { this.to('on') }
//    }
// })


// const $trafficLight = Finitron('red', {
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


// finitron existence
// - create
// - destroy

// finitron activity
// - activate
// - deactivate

// finitron state 
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

// TODO: nesting
// TODO: onTerminalized

// nesting means nested state will be activated and deactivated based on the parents
// QUESTION: If a finitron reaches final state what does that mean for it's parent(s) and children?
// QUESTION: Can a finitron have more than one parent?
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
//    $power.terminalize() //FIX: only when all nested finitrons are terminalized and 
// )

export const ANY_STATE = "any"
type _FiniteStates = { [key: PropertyKey]: any }

type FiniteStates<S extends _FiniteStates = _FiniteStates> = { [key: string]: StateDefinition<S> } & {
   [ANY_STATE]?: StateDefinition<S>
}

type Transition<S extends _FiniteStates = _FiniteStates> = () => State<S> | undefined | false | null | void

type Task = () => void


const [pushFinitron, popFinitron, getFinitron] = createStack<Finitron>()

// TODO: should on:enter apply to intitial state?
type StateDefinition<S extends _FiniteStates = _FiniteStates> = {
   'on:enter'?: (this: Finitron) => void
   'on:exit'?: (this: Finitron) => void
} & { [key: string | symbol]: Transition<S> } & {[K in keyof FinitronProperties<S>]?: never}

type AllKeys<T> = T extends T ? keyof T : never;

type State<S extends _FiniteStates> = Exclude<keyof S, typeof ANY_STATE | number>
type TransitionKey<S extends _FiniteStates> = Exclude<AllKeys<S[keyof S]>, number | symbol>

type Init = () => void

type FinitronProperties<S extends FiniteStates<S>> = {
   state: State<S> | undefined
   is: (state: State<S> | undefined) => boolean
   on: (transition: TransitionKey<S>, task: () => void) => void
   can: (transition: TransitionKey<S>) =>boolean
   // apply: (transition: TransitionKey<S>) => void
   // op: (transition: TransitionKey<S>) => boolean
   atFinalState: (task: () => void) => void
   // activate: (initializer: () => State<S>) => { nest: (config: { [key: string]: Nested[] }) => Nested }
   init: (state: State<S> | undefined, nested?: { [K in keyof Partial<S>]: Init }) => void
   deactivate: () => void
   isActive: () => boolean
   lastState: State<S> | undefined
   onDeactivated: (task: () => void) => void
}

export type Finitron<S extends FiniteStates<S> = FiniteStates<_FiniteStates>, M extends Methods = {}> = FinitronProperties<S>& M & TransitionMethods<S>

type TransitionMethods<S> = UnionToIntersection<S[keyof S]>


// type Nested = {
//    finitron: Finitron,
//    initializer: Initializer,
// }

type Initializer = (prevState: string | undefined) => string


type Methods<S> = { [key: string | symbol]: (...args: unknown[]) => unknown } & {[K in keyof FinitronProperties<S>]?: never}

type TransitionEvent = { state: string | undefined, prevState: string | undefined }

type Hooks = {
   onEnter: ((this: Finitron) => void) | undefined;
   onExit: ((this: Finitron) => void) | undefined;
   afterEnter: Transition | undefined
}

// type NestedStates = { [key: string]: Nested[] }

export function withTimeout(ms: number, transition: Transition) {
   //@ts-expect-error
   transition.timeout
      = ms;
   return transition;
}

// TODO: Traceability
export function Finitron<S extends FiniteStates, M>(states: S, methods?: M & Methods<S>): Finitron<S, M> {
   const $currentState = Ion(undefined as undefined | string);

   let activated = false;

   const _finitron: FinitronProperties<S> = {
      is,
      on,
      can,
      atFinalState,
      // activate,
      deactivate,
      // init,
      init,
      isActive: () => $currentState() !== undefined,
      get state() {
         return $currentState()
      },
      get lastState() {
         return prevState
      },
      onDeactivated,
   }

   const finitron = new Proxy(_finitron, {
      get(target, key) {
         if (key in _finitron) {
            return _finitron[key]
         }
         return () => apply(key)
      }
   })

   // TODO: attach methods

   // let _nestedStates: NestedStates;

   // function init(initializer: Initializer) {
   //    return {
   //       finitron,
   //       initializer,
   //       nest: (nestedStates: { [key: string]: Nested[] }) => {
   //          if (_nestedStates) {
   //             debug.error('Cannot redefine nested states')
   //             return;
   //          }
   //          _nestedStates = nestedStates
   //          // updateNestedStates(initializer(undefined), 'activate') // TODO: should not activate if not activated

   //          return {
   //             finitron,
   //             initializer,
   //          };
   //       }
   //    };
   // }

   // function updateNestedStates(state: string, key: 'activate' | 'deactivate') {
   //    if (!_nestedStates) return;
   //    const nestedFinitrons = _nestedStates[state];
   //    if (!nestedFinitrons) return;
   //    for (const entry of nestedFinitrons) {
   //       const { finitron, initializer } = entry
   //       key === 'activate' ? finitron.activate(initializer as () => string) : finitron.deactivate()
   //    }
   // }

   let prevState: string | undefined;

   // function activate(initializer: (prevState: string | undefined) => string) {
   //    if (activated) return;
   //    activated = true;
   //    const state = $currentState.value = initializer(prevState);
   //    runEnterHooks(state, getHooks(ANY_STATE))
   //    return {
   //       nest: (nestedStates: { [key: string]: Nested[] }) => {
   //          if (_nestedStates) {
   //             debug.error('Cannot redefine nested states')
   //             return;
   //          }
   //          _nestedStates = nestedStates
   //          updateNestedStates(state, 'activate')
   //       }
   //    }
   // }

   let onEnter: { [K in State<S>]: Init } | undefined

   function init(initialState: State<S> | undefined, nested?: { [K in State<S>]: Init }) {
      if (activated) return finitron;
      activated = true;
      const state = $currentState.value = initialState
      const parent = getFinitron()
      if (parent) {
         console.log('*&* init', initialState, getActiveUpdate()?.cycle.currentPhase)
         queueTask(() => { // must queue because parent.state has not been set yet and will trigger effect early when set
            watch(() => parent.state, ({ previous }) => {
               console.log('*&* deactivating finitron', finitron.state)
               finitron.deactivate()
            }, { phase: PRELUDE, once: true })
         })
      }
      if (nested) {
         onEnter = nested
      }
      runEnterHooks(state as string, getHooks(ANY_STATE))
      return finitron;
   }

   let deactivationTasks: Task[] = []

   function onDeactivated(task: Task) {
      deactivationTasks.push(task)
   }

   function runDeactivationTasks() {
      for (const task of deactivationTasks) {
         task()
      }
      deactivationTasks = []
   }

   function deactivate() {
      if (!activated) return;
      activated = false;
      if (timeout) clearTimeout(timeout);
      const prevStateID = prevState = $currentState.value
      console.log('deactivate', states, prevStateID)
      runExitHooks(prevStateID!, getHooks(ANY_STATE))
      $currentState.value = undefined;
      runDeactivationTasks()
   }

   function is(state: string | undefined) {
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
      return untracked($currentState)
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

   function atFinalState(task: () => void) {
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
      return Boolean(states[$currentState.value ?? ''][transition])
   }

   function applyTransition(transition: string | Transition) {
      const prevStateID = $currentState.value;
      const state = states[prevStateID ?? '']

      const getNextState = typeof transition === 'string' ? (state[transition] ?? states[ANY_STATE as any]?.[transition]) : transition;
      if (!getNextState) return;

      const nextStateID = getNextState();
      if (!nextStateID) return;
      if (!(nextStateID in states)) //QUESTION: How to transition to nested or parent state?
         throw new Error('Invalid State')

      const anyStateHooks = getHooks(ANY_STATE)
      if (prevStateID) {
         runExitHooks(prevStateID, anyStateHooks) // TODO: should I pass the next state to the exit hook?
      }

      $currentState.value = nextStateID;
      console.log('next state', nextStateID, $currentState[QUARK])

      runEnterHooks(nextStateID, anyStateHooks) // TODO: should I pass the prev state to the enter hook?

      return {
         state: nextStateID,
         prevState: prevStateID
      }
   }

   function runEnterHooks(stateID: string, anyStateHooks: Hooks) {
      if (onEnter && stateID in onEnter) {
         pushFinitron(finitron)
         onEnter[stateID]()
         popFinitron()
      }
      const nextStateHooks = getHooks(stateID)

      nextStateHooks.onEnter?.apply(finitron)
      anyStateHooks.onEnter?.apply(finitron)

      setUpTimeout(nextStateHooks.afterEnter)
      setUpTimeout(anyStateHooks.afterEnter)

      // updateNestedStates(stateID, 'activate')
   }

   function runExitHooks(stateID: string, anyStateHooks: Hooks) {
      getHooks(stateID).onExit?.apply(finitron)
      anyStateHooks.onExit?.apply(finitron)

      // updateNestedStates(stateID, 'deactivate')
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

   return finitron
}





function extractHooks(state: StateDefinition) {

   return {
      onEnter: state['on:enter'],
      onExit: state['on:exit'],
      afterEnter: extractTimedTransition(state)
   }
}

function extractTimedTransition(state: StateDefinition) {
   for (const key in state) {
      if (key.startsWith("after:")) {
         return withTimeout(parseInt(key.slice(6)), state[key])
      }
   }
}

function isTerminal(state: string) {
   return state.startsWith('x:')
}