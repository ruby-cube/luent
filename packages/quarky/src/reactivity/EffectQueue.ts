import { __DEV__unwrap, noop } from "@rue/utils";
import { TrackedAtom } from "./Atom";
import { catchCancelledUpdate } from "./x_IdleUpdate";
import { Phase, SYNC, CycleProcess, RENDER } from "./RenderCycle";
import { $activeUpdate, Update, popUpdate, pushUpdate, tickUpdate } from "./Update";


type TaskFn = (...args: any[]) => unknown

export class Effect {
   constructor(
      public run: TaskFn | null,
      public phase: Phase
   ) { }

   private atoms: Set<TrackedAtom> = new Set()

   isLinked(atom: TrackedAtom) {
      return this.atoms.has(atom)
   }

   link(atom: TrackedAtom) {
      if (this.isLinked(atom)) return;
      atom.link(this)
      this.atoms.add(atom);
   }

   destroy() {
      this.run = null;
      this.unlinkAtoms()
   }

   unlink(atom: TrackedAtom) {
      if (!this.isLinked(atom)) return;
      this.atoms.delete(atom)
   }

   unlinkAtoms() {
      this.atoms.clear()
   }
}


let effectStackCount = 0;

export class EffectQueue {
   effects: Effect[] | undefined;
   nextEffects: Effect[] = []
   retained: Set<Effect> = new Set()

   constructor(
      private phase: Phase,
      private atom?: TrackedAtom
   ) {

   }

   *runEffects(run: (effect: Effect) => void, completed: Set<Effect> | undefined, process?: CycleProcess, onComplete: () => void = noop) {
      const effects = this.nextEffects
      this.nextEffects = []
      const phase = this.phase
      const sync = phase === SYNC

      const limit = effects.length
      // console.log('>>> running phase', phase, 'of', this.atom)
      for (let i = 0; i < limit; i++) {
         const effect = effects[i]
         if (phase === RENDER) console.log('running render effect', effect)
         // if (cestLePromis(effect)) console.log('le promis is here')
         if (
            !effect.run
            || this.atom && !effect.isLinked(this.atom) // weeds out effects that have been unlinked due to retracking
         ) {
            // if (cestLePromis(effect)) console.warn('NO RUN')
            continue;
         }
         // prevent repeats within queue (but not across extended queues and phases)
         if (completed?.has(effect)) {
            this.retain(effect)
            // if (cestLePromis(effect)) console.warn('ALREADY RUN')
            continue;
         }

         try {
            effectStackCount++
            if (effectStackCount > 100_000) throw new Error('Infinite loop detected')
            // if (cestLePromis(effect)) {
            //    console.warn('>>> run le promis!')
            // }
            run(effect)
         }
         // catch (err) {
         //    catchCancelledUpdate(err)
         // }
         finally {
            effectStackCount--
            completed?.add(effect)
            this.retain(effect)
         }

         if (process && process.mustPause() && i + 1 < limit) {
            const update = $activeUpdate()
            if (update) {
               popUpdate()
               process.prepPause(() => {
                  if (update.committed) return;
                  pushUpdate(update)
               })
            }
            else {
               process.prepPause(() => { })
               console.warn('no update :(')
            }
            yield;
         }
      }

      if (sync && effectStackCount !== 0) {
         return;
      }

      this.effects = undefined
      this.retained.clear()
      onComplete()
   }

   retain(effect: Effect) {
      if (this.retained.has(effect) || !effect.run || this.atom && !effect.isLinked(this.atom)) return;
      this.nextEffects.push(effect)
      this.retained.add(effect)
   }

   /**
   * To be called by watch() when initializing watcher
   * @param effect 
   */
   queue(effect: Effect) {
      this.nextEffects.push(effect)
   }

   requeued: boolean = false;
   queued: boolean = false
}


export function cestLePromis(effect: Effect) {
   return effect.__DEV__fn && effect.__DEV__fn.toString().includes('current: promise,')
}

/**
 * Belongs to the current effect cycle.
 */
export class TaskQueue {
   moreEffects: EffectQueue[] | undefined;
   effects: EffectQueue[] = []
   tasks: (() => void)[] = []

   cancel!: () => void;

   started = false;

   runEffect(effect: Effect) {
      effect.run?.()
   }

   constructor(
      public update: Update,
      protected phase: Phase
   ) {
   }

   scheduleTask(task: () => void) {
         this.tasks.push(task)
   }

   scheduleEffects(effects: EffectQueue) {
      if (this.runningEffects && !effects.requeued) {
         effects.requeued = true;
         const extension = this.moreEffects ?? (this.moreEffects = [])
         extension.push(effects)
      }
      else if (!effects.queued) {
         this.effects.push(effects)
         effects.queued = true;
      }
      else console.warn('NOTHING', effects.queued, effects.requeued)
   }

   runningEffects: boolean = false
}

