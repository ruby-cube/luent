import { $listen, Flask, getActiveFlask, getFlask, PausableListener, SustainedListenerOptions } from "@luently/flask";
import { Reaction } from "./Reaction";
import { asSubstance, IonSubstance, isSubstance, Substance } from "./Substance";
import { AnyObject, Glass } from "@luently/types";
import { __DEV__unwrap } from "@luently/utils";
import { SimpleState } from "./State";
import { $currentCycle, getDefaultPhase, Phase, PRELUDE, SYNC } from "./RenderCycle";
import { dev, logAtoms } from "../debug/dev";
import { Traceable } from "../debug/Traceable";
import { Ion } from "../ion/Ion";
import { hasQuark, quarkOf } from "../abstract/Quark";
import { toValue } from "../ion/utils";
import { $activeUpdate, getActiveUpdate } from "./Update";


// observe(list.$length, list.$couch, sync(() => {
//    doSomething(prevList)
// }))

// observe(multisubstance(list.$length, list.$couch), sync(() => {
//    doSomething(prevList)
// }))


/**
 * Default values:
 * 
 * phase: 1
 * eager: false
 * retrack: true
 * cycle: 'current'
 * hasChanged: a !== b
 */
export type ReactionOptions = {
  phase?: Phase;
  preserve?: boolean;
  retrack?: boolean;
} & Glass<SustainedListenerOptions & ObserverDebugOptions>

export type ObserverDebugOptions = {
  devName?: string,
  'dev.logAtoms'?: boolean,
  'dev.traceTriggers'?: boolean
}

export type ReactionTask<T = unknown> = (event: StateChangeEvent<SubstanceValues<T>>) => void;

type SubstanceValues<T> = [T] extends [() => infer R] ? R : [T] extends [infer O] ? O : MultiSubstanceValues<T>;

type MultiSubstanceValues<T> =
  T extends [infer A, infer B] ? [SubstanceValue<A>, SubstanceValue<B>]
  : T extends [infer A, infer B, infer C] ? [SubstanceValue<A>, SubstanceValue<B>, SubstanceValue<C>]
  : T extends [infer A, infer B, infer C, infer D] ? [SubstanceValue<A>, SubstanceValue<B>, SubstanceValue<C>, SubstanceValues<D>]
  : T extends [infer A, infer B, infer C, infer D, infer E] ? [SubstanceValue<A>, SubstanceValue<B>, SubstanceValue<C>, SubstanceValue<D>, SubstanceValue<E>]
  : T extends [infer A, infer B, infer C, infer D, infer E, infer F] ? [SubstanceValue<A>, SubstanceValue<B>, SubstanceValue<C>, SubstanceValue<D>, SubstanceValue<E>, SubstanceValue<F>]
  : T

type SubstanceValue<T> = T extends () => infer R ? R : T






// Possible substances
// ---
// plain function (potentially inert)
// ion (potentially inert/neutron) (should have a observe fn on quark)
// memoized ion
// 
// ionized model possibly with absorbed ions
// --
// plain array with all sorts of substances
// --
// ionized collection

export class StateChangeEvent<S = unknown> {
  // trace?: string;
  constructor(
    public previous: S | undefined,
    public current: S,
    public eager: boolean
  ) { }
}

export type ObservedSubstances = (Object | Ion)[]

export function observe<T>(substance: T, reaction: ReactionTask<T>, options: ReactionOptions = {}): PausableListener {
  if (import.meta.env.SSR) return InertObserver()
  options.retrack = options.retrack ?? true;

  const target = asSubstance(substance, options.retrack)
  target.asTraceable = new Traceable(options?.devName ?? 'observe' + substance)

  if (!isSubstance(target)) { // plain object
    if (options?.eager) {
      scheduleEagerReaction(() =>
        reaction(new StateChangeEvent(undefined, substance, true))
        , getPhase(options))
    }
    return InertObserver()
  }

  const prevState = new SimpleState(target.getState()) // tracking

  if (!target.reactive) {
    if (options?.eager) {
      scheduleEagerReaction(() =>
        reaction(new StateChangeEvent(undefined, prevState.get(), true))
        , getPhase(options))
    }
    return InertObserver()
  }

  function wrappedReaction() {
    const newState = target.getState() // retracking
    // console.log('reaction!!!', prevState.get(), newState)

    try {
      (<ReactionTask>reaction)(new StateChangeEvent(prevState.get(), newState, !!options.eager))
    }
    finally {
      options.eager = false;
      prevState.set(newState);
      // hasChanged = getHasChangedFn(options, prevState.get()) //accounts for ions whose value may change from ionized to not ionized
    }
  }
  wrappedReaction.__DEV__fn = reaction

  return setUpObserver(
    target,
    wrappedReaction,
    options,
  )
}

type Task = () => void

export function getPhase(options: undefined | ReactionOptions): Phase {
  return options?.phase ?? getDefaultPhase()
}



export function sync<F>(fn: F): F {
  //@ts-expect-error
  fn.sync = true
  return fn
}


export function setUpObserver(
  substance: Substance,
  task: Task,
  options: ReactionOptions,
) {
  const phase = options.phase = getPhase(options)
  const eager = options.eager ?? false;
  // TODO: options.preserve means non-pausable observer
  const preserve = options.preserve

  // task = maybePostcycleTask(task, phase)

  // if (eager) {
  //    scheduleEagerReaction(task, phase)
  // }
  if (options?.["dev.traceTriggers"]) {

  }


  return $listen(task, options || {}, {
    enroll(_task) {
      const reaction = new Reaction(_task, phase)
      reaction.__DEV__fn = task.__DEV__fn
      substance.linkReaction(reaction)
      if (eager) {
        scheduleEagerReaction(_task, phase)
      }
      return reaction;
    },
    remove(reaction: Reaction) {
      reaction.destroy()
    },
    pausable: true
  });
}


export function scheduleEagerReaction(task: Task, phase: Phase) {
  if (!getActiveUpdate()) $activeUpdate()
  const cycle = $currentCycle()
  cycle.scheduleTask(task, phase)
  if (phase === SYNC) {
    cycle.runReactions(SYNC)
  }
}





export function InertObserver() {
  function noOp() {
    return false;
  }
  return { // inert observe substances
    stop: noOp,
    pause: noOp,
    resume: noOp,
  }
}






/**
 * Optimized barebones ion-only observe function. links reaction to atoms and flask. No async context used.
 * @param ion 
 * @param render 
 * @param eager 
 * @returns 
 */
export function trackForRender<T>(ion: Ion<T>, render: (state: { current: T, previous: T, flask: Flask, eagerRun: boolean }) => void, flask: Flask = getActiveFlask(), eager: boolean = false) {
  // observe(ion, (e)=>render({current: e.current, previous: e.previous, flask: getActiveFlask()}), {phase: PRELUDE, eager})
  // return;
  const substance = new IonSubstance(() => toValue(ion())) // toValue in case of mutable ion getter

  let prevState = substance.getState()

  if (!substance.reactive && !eager) {
    return;
  }

  let stale = false;
  let paused = false;

  const reaction = new Reaction(() => {
    if (paused) {
      stale = true;
      return;
    }
    stale = false;
    _render()
  }, PRELUDE)

  let eagerRun = eager;

  function _render() {
    const newState = substance.getState()
    render({ current: newState, previous: prevState, flask, eagerRun })
    eagerRun = false;
    prevState = newState;
  }

  if (eager) {
    scheduleEagerReaction(_render, PRELUDE)
  }

  substance.linkReaction(reaction)

  flask?.onDiscard(/* listener.stop */() => {
    reaction.destroy()
  });
  flask?.onDemount(/* listener.pause */() => {
    paused = true;
  });
  flask?.onRemount(/* listener.resume */() => {
    paused = false;
    if (stale) {
      reaction.run?.()
    }
  });
}

export const RUN_EAGERLY = true;
