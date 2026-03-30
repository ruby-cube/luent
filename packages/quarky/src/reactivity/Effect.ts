import { __DEV__unwrap, noop } from "@rue/utils";
import { TrackedAtom } from "./Atom";
import { Phase } from "./RenderCycle";


type TaskFn = (...args: any[]) => unknown

export class Effect {
   fn: TaskFn | null;

   constructor(
      public run: TaskFn | null,
      public phase: Phase
   ) {
      this.fn = run;
   }

   link(atom: TrackedAtom) {
      this.run = this.fn // relink
      // if (!atom.isLinked(this)) {
         atom.link(this)
      // }
   }

   destroy() {
      this.unlink()
      this.fn = null;
   }

   unlink() {
      this.run = null
   }
}


// let effectStackCount = 0;

// export class EffectQueue {
//    effects: Effect[] | undefined;
//    nextEffects: Effect[] = []
//    nextLinkedEffects: Set<Effect> = new Set()
//    retained: Set<Effect> = new Set()

//    constructor(
//       private phase: Phase,
//       private atom?: TrackedAtom
//    ) {

//    }

//    *runEffects(run: (effect: Effect) => void, completed: Set<Effect> | undefined, process?: CycleProcess, onComplete: () => void = noop) {
//       const effects = this.nextEffects
//       this.nextEffects = []
//       this.nextLinkedEffects = new Set()
//       const phase = this.phase
//       const sync = phase === SYNC

//       const limit = effects.length
//       console.log('>>> running phase', phase, 'of', this.atom, '# of effects:', limit)
//       for (let i = 0; i < limit; i++) {
//          const effect = effects[i]
//          if (
//             !effect.run // weeds out effects that have been unlinked due to retracking
//          ) {
//             console.log('!effect.run', effect.fn)
//             continue;
//          }
//          // prevent repeats within queue (but not across extended queues and phases)
//          if (completed?.has(effect)) {
//             console.log('completed?.has(effect)', effect.fn)
//             this.retain(effect)
//             continue;
//          }

//          try {
//             effectStackCount++
//             if (effectStackCount > 100_000) throw new Error('Infinite loop detected')
//             run(effect)
//          }
//          // catch (err) {
//          //    catchCancelledUpdate(err)
//          // }
//          finally {
//             effectStackCount--
//             completed?.add(effect)
//             if (phase !== SYNC) this.retain(effect)
//          }

//          if (process && process.mustPause() && i + 1 < limit) {
//             const update = $activeUpdate()
//             if (update) {
//                popUpdate()
//                process.prepPause(() => {
//                   if (update.committed) return;
//                   pushUpdate(update)
//                })
//             }
//             else {
//                process.prepPause(() => { })
//                console.warn('no update :(')
//             }
//             yield;
//          }
//       }

//       if (sync && effectStackCount !== 0) {
//          return;
//       }

//       this.effects = undefined
//       this.retained.clear()
//       onComplete()
//    }

//    retain(effect: Effect) {
//       if (this.retained.has(effect) || !effect.run) return;
//       this.nextEffects.push(effect)
//       this.nextLinkedEffects.add(effect)
//       this.retained.add(effect)
//    }

//    /**
//    * To be called by watch() when initializing watcher
//    * @param effect 
//    */
//    queue(effect: Effect) {
//       this.nextLinkedEffects.add(effect)
//       this.nextEffects.push(effect)
//    }

//    requeued: boolean = false;
//    queued: boolean = false
// }



// /**
//  * Belongs to the current effect cycle.
//  */
// export class TaskQueue {
//    moreEffects: EffectQueue[] | undefined;
//    effects: EffectQueue[] = []
//    tasks: (() => void)[] = []

//    cancel!: () => void;

//    started = false;

//    runEffect(effect: Effect) {
//       effect.run?.()
//    }

//    constructor(
//       public update: Update,
//       protected phase: Phase
//    ) {
//    }

//    scheduleTask(task: () => void) {
//       this.tasks.push(task)
//    }

//    scheduleEffects(effects: EffectQueue) {
//       if (this.runningEffects && !effects.requeued) {
//          effects.requeued = true;
//          const extension = this.moreEffects ?? (this.moreEffects = [])
//          extension.push(effects)
//       }
//       else if (!effects.queued) {
//          this.effects.push(effects)
//          effects.queued = true;
//       }
//       else console.warn('NOTHING', effects.queued, effects.requeued)
//    }

//    runningEffects: boolean = false
// }

