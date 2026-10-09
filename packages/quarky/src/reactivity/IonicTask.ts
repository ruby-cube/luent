import { $listen, getFlask, SustainedListenerOptions } from "@luently/flask";
import { getPhase, scheduleEagerReaction, ObserverDebugOptions } from "./Observer";
import { Glass } from "@luently/types";
import { Reaction } from "./Reaction";
import { linkReactionToAtom } from "./Substance";
import { Traceable, TraceableEntity } from "../debug/Traceable";
import { LAYOUT, Phase, PRELUDE, RENDER, SYNC, TICK } from "./RenderCycle";
import { Ion } from "../ion/Ion";
import { Compound, popTracker, pushTracker } from "./Compound";


type _IonicTaskOptions = {
  phase?: Phase;
  sync?: boolean;
} & Glass<SustainedListenerOptions & ObserverDebugOptions>




export type Observer = <T>(ion: Ion<T>) => T

type IonicTask = (observer: Observer, initial: boolean) => void

function _queueIonicTask(task: IonicTask, options?: _IonicTaskOptions) {

  const phase = getPhase(options)

  let initial = true;
  let reaction: Reaction
  let substance: AsyncSubstance | null

  const wrappedReaction = () => {
    const output = task(fn => substance!.trackAtoms(fn), initial)
    getFlask().onDiscard(() => {
      substance!.clearAtoms()
      substance = new AsyncSubstance(reaction)
    })
    return output;
  }

  // TODO: options.preserve means non-pausable observer
  // const preserve = options?.preserve


  return $listen(wrappedReaction, options || {}, {
    enroll(_task) {
      reaction = new Reaction(_task, phase);
      scheduleEagerReaction(() => {
        substance = new AsyncSubstance(reaction)
        _task() // This is the initial call
        initial = false
      }, phase)
      return reaction;
    },
    remove(reaction: Reaction) {
      reaction.destroy()
    }
  });
}

type IonicTaskOptions = { [K in keyof _IonicTaskOptions as K extends 'phase' ? never : K]: _IonicTaskOptions[K] }


export function awaitsPrelude(task: IonicTask, options?: IonicTaskOptions) {
  return _queueIonicTask(task, { ...options ?? {}, phase: PRELUDE })
}

export function observeCall(task: IonicTask, options?: IonicTaskOptions) {
  return _queueIonicTask(task, { ...options ?? {}, phase: SYNC })
}

export function awaitsRender(task: IonicTask, options?: IonicTaskOptions) {
  return _queueIonicTask(task, { ...options ?? {}, phase: RENDER })
}

export function awaitsLayout(task: IonicTask, options?: IonicTaskOptions) {
  return _queueIonicTask(task, { ...options ?? {}, phase: LAYOUT })
}

// export function queueIonicPostlude(task: IonicTask, options?: IonicTaskOptions) {
//    return _queueIonicTask(task, { ...options ?? {}, phase: POSTLUDE })
// }

export function awaitsTick(task: IonicTask, options?: IonicTaskOptions) {
  return _queueIonicTask(task, { ...options ?? {}, phase: TICK })
}




/**
 * Primitive substance for derivation ions and ionic tasks.
 */
export class AsyncSubstance extends Compound implements TraceableEntity {

  constructor(
    private reaction: Reaction,
    private devName?: string
  ) {
    super()
    this.asTraceable = __DEV__ ? new Traceable('ionic task:' + devName): undefined // TODO: add phase details
  }

  asTraceable: Traceable | undefined

  trackAtoms(fn: () => any) {
    pushTracker(this);
    try {
      return fn();
    }
    finally {
      this.forEachAtom(atom => {
        linkReactionToAtom(atom, this.reaction)
      })
      popTracker();
    }
  }

  clearAtoms() {
    this.reaction.unlink()
    this.untrackAtoms()
  }
}