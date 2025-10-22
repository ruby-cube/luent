import { debug } from "@rue/utils";
import { ion, QUARK } from "@rue/quarky";


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


// const $trafficLight = FiniteState('red', {
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

// TODO: nesting
// TODO: onTerminalized

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

export const ANY_STATE = "any"
type _FiniteStates = {[key: string]: any}

type FiniteStates<S extends _FiniteStates = _FiniteStates> = { [key: string]: StateDefinition<S> } & {
   [ANY_STATE]?: StateDefinition<S>
}

type Transition<S extends _FiniteStates = _FiniteStates> = () => State<S> | undefined | false | null | void



type A = keyof ({ a: boolean } | { b: boolean })


// TODO: should on:enter apply to intitial state?
type StateDefinition<S extends _FiniteStates = _FiniteStates> = {
   'on:enter'?: (this: FiniteState) => void
   'on:exit'?: (this: FiniteState) => void
} & { [key: string | symbol]: Transition<S> }

type AllKeys<T> = T extends T ? keyof T : never;

type State<S extends _FiniteStates> = Exclude<keyof S, typeof ANY_STATE | number>
type TransitionKey<S extends _FiniteStates> = Exclude<AllKeys<S[keyof S]>, number | symbol>


export type FiniteState<S extends FiniteStates<S> = FiniteStates<_FiniteStates>, M extends Methods = {}> = {
   (): State<S>
   is: (state: State<S>) => boolean
   on: (transition: TransitionKey<S>, task: () => void) => void
   apply: (transition: TransitionKey<S>) => void
   op: (transition: TransitionKey<S>) => boolean
   onFinalState: (task: () => void) => void
   activate: (initializer: () => State<S>) => { nest: (config: { [key: string]: Nested[] }) => Nested }
   deactivate: () => void
   isActive: () => boolean
   init: (initializer: Initializer) => Nested & { nest: (config: { [key: string]: Nested[] }) => Nested }
} & M

type Nested = {
   finiton: FiniteState,
   initializer: Initializer,
}

type Initializer = (prevState: string | undefined) => string


type Methods = { [key: string | symbol]: (...args: unknown[]) => unknown }

type TransitionEvent = { state: string | undefined, prevState: string | undefined }

type Hooks = {
   onEnter: ((this: FiniteState) => void) | undefined;
   onExit: ((this: FiniteState) => void) | undefined;
   afterEnter: Transition | undefined
}

type NestedStates = { [key: string]: Nested[] }

export function withTimeout(ms: number, transition: Transition) {
   //@ts-expect-error
   transition.timeout
      = ms;
   return transition;
}

//TODO: implement as custom ionized object
export function FiniteState<S extends FiniteStates, M extends Methods>(states: S, methods?: M): FiniteState<S, M> {
   const $currentState = ion(undefined as undefined | string);

   let activated = false;

   const $state = (() => $currentState()) as unknown as FiniteState

   // }) as unknown as FiniteState
   $state.is = is
   $state.apply = apply
   $state.on = on
   $state.can = can
   $state.onFinalState = onFinalState
   $state.activate = activate
   $state.deactivate = deactivate
   $state.init = init
   $state.isActive = () => $currentState() !== undefined;

   // TODO: attach methods

   let _nestedStates: NestedStates;

   function init(initializer: Initializer) {
      return {
         finiton: $state,
         initializer,
         nest: (nestedStates: { [key: string]: Nested[] }) => {
            if (_nestedStates) {
               debug.error('Cannot redefine nested states')
               return;
            }
            _nestedStates = nestedStates
            // updateNestedStates(initializer(undefined), 'activate') // TODO: should not activate if not activated

            return {
               finiton: $state,
               initializer,
            };
         }
      };
   }

   function updateNestedStates(state: string, key: 'activate' | 'deactivate') {
      if (!_nestedStates) return;
      const nestedFinitons = _nestedStates[state];
      if (!nestedFinitons) return;
      for (const entry of nestedFinitons) {
         const { finiton, initializer } = entry
         key === 'activate' ? finiton.activate(initializer as () => string) : finiton.deactivate()
      }
   }

   let prevState: string | undefined;

   function activate(initializer: (prevState: string | undefined) => string) {
      if (activated) return;
      activated = true;
      const state = $currentState.value = initializer(prevState);
      runEnterHooks(state, getHooks(ANY_STATE))
      return {
         nest: (nestedStates: { [key: string]: Nested[] }) => {
            if (_nestedStates) {
               debug.error('Cannot redefine nested states')
               return;
            }
            _nestedStates = nestedStates
            updateNestedStates(state, 'activate')
         }
      }
   }

   function deactivate() {
      if (!activated) return;
      activated = false;
      if (timeout) clearTimeout(timeout);
      const prevStateID = prevState = $currentState.value
      runExitHooks(prevStateID!, getHooks(ANY_STATE))
      $currentState.value = undefined;
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
         if (isTerminal(transitionEvent.value)) {
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

      runEnterHooks(nextStateID, anyStateHooks) // TODO: should I pass the prev state to the enter hook?

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
         if (transitionEvent && isTerminal(transitionEvent.value)) {
            runFinalTasks()
         }
      }, transition.timeout ?? 0)
   }

   return $state as FiniteState
}





function extractHooks(state: StateDefinition) {

   return {
      onEnter: state['on:enter'],
      onExit: state['on:exit'],
      afterEnter: extractTimedTransition(state)
   }
}

function extractTimedTransition(state: StateDefinition){
   for (const key in state){
      if (key.startsWith("after:")){
         return withTimeout(parseInt(key.slice(6)), state[key])
      }
   }
}

function isTerminal(state: string) {
   return state.startsWith('x:')
}