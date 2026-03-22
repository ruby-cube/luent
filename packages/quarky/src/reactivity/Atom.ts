import { __DEV__unwrap } from "@rue/utils";
import { Effect } from "./Effect";
import { hasQuark, QUARK } from "../abstract/Quark";
import { $activeUpdate, Update, UpdateType } from "./Update";
import { TraceableEntity } from "../debug/Traceable";
import { Stateful } from "../abstract/Stateful";
import { createPhaseMap, LAYOUT, Phase, phaseKeys, PRELUDE, queueTask, RENDER, RenderCycle, SYNC, TICK } from "./RenderCycle";


export type Atom = {
   asTrackedAtom: TrackedAtom | undefined;
} & TraceableEntity & Stateful


/**
 * @param quark 
 * @param op 
 * @param args 
 * @param output 
 * @param preopData 
 */
export function trigger(
   atom: Atom | undefined
) {
   if (!atom) return;
   atom.asTrackedAtom?.triggerEffects()
}


export function isTrackableAtom(value: unknown): value is { [QUARK]: Atom } {
   return hasQuark(value) && 'asTrackedAtom' in value[QUARK];
}


export function asTrackedAtom(watchable: Atom) {
   // console.log('asTrackedAtom', watchable)
   return watchable.asTrackedAtom ?? (watchable.asTrackedAtom = new TrackedAtom(watchable))
}


// export class _TrackedAtom {

//    constructor(
//       public entity: Atom
//    ) {

//    }

//    private effects: Map<Phase, EffectQueue> = new Map()
//    private phases: Phase[] = []


//    private initializePhase(phase: Phase) {
//       this.phases.push(phase)
//       const queue: EffectQueue = new EffectQueue(phase, this)
//       this.effects.set(phase, queue);
//       return queue
//    }


//    /**
//      * To be called by watch() when initializing watcher
//      * @param effect 
//      */
//    link(effect: Effect) {
//       (this.effects.get(effect.phase) ?? this.initializePhase(effect.phase)).queue(effect);
//    }

//    isLinked(effect: Effect) {
//       const effects = (this.effects.get(effect.phase) ?? this.initializePhase(effect.phase))
//       return effects.nextLinkedEffects.has(effect)
//    }

//    triggerEffects() { // the surrounding effect when original trigger happened
//       const phases = this.phases
//       const cycle = $activeUpdate().cycle
//       for (const phase of phases) {
//          // console.warn('schedule effects', phase, this.effects.get(phase), this)
//          cycle.scheduleEffects(this.effects.get(phase)!, phase)
//          if (phase === SYNC) {
//             console.log('run sync effects')
//             cycle.runSyncEffects()
//          }
//       }
//    }
// }



export class Effects {
   effects: Set<Effect> = new Set()

   constructor(
      public phase: Phase,
      private runEffect = (effect: Effect, update: Update) => effect.run!()
   ) {

   }

   runEffects(ran: Set<Effect>, update: Update) {
      const effects = this.effects;
      this.effects = new Set()

      for (const effect of effects) {
         if (!effect.run || ran.has(effect)) {
            continue;
         }

         ran.add(effect)
         this.runEffect(effect, update)

         if (effect.fn) {
            this.effects.add(effect) // retain
         }
      }
   }

   add(effect: Effect) {
      this.effects.add(effect)
   }
}

export class TrackedAtom {

   constructor(
      public entity: Atom // needed for DEV only
   ) {

   }

   phases = phaseKeys

   effects: { [K in typeof phaseKeys[number]]?: Effects } = createPhaseMap()

   private getEffects(phase: Phase) {
      return this.effects[phase] ?? (this.effects[phase] = this.createPhaseEffects(phase))
   }

   private createPhaseEffects(phase: Phase) {
      if (phase === TICK) {
         return new Effects(TICK, (effect: Effect, update: Update) => {
            requestAnimationFrame(() => {
               queueTask(() => {
                  if (!effect.run) return;
                  const _update = new Update(
                     update.type,
                     update.timeMargin,
                     update.type === UpdateType.USER_INTERACTION ? false : update.idle // TODO: not sure about this
                  )
                  _update.queue(effect.run).start()
               })
            })
         })
      }

      return new Effects(phase)
   }
   /**
     * To be called by watch() when initializing watcher
     * @param effect 
     */
   link(effect: Effect) {
      this.getEffects(effect.phase).add(effect)
      console.log('link effect', effect, effect.phase, this.effects)
   }

   isLinked(effect: Effect) {
      return this.getEffects(effect.phase).effects.has(effect)
   }

   triggerEffects() {
      const phases = this.phases
      const cycle = $activeUpdate().cycle as unknown as RenderCycle
      if (__DEV__) assertSyncPhase(phases[0])
      for (let i = 1; i < phases.length; i++) {
         const phase = phases[i]
         const effects = this.effects[phase]
         console.log('@@@trigger effects', this.entity, phase, effects)
         if (!effects) continue;
         cycle.scheduleEffects(effects, phase)
      }
      const syncEffects = this.effects[SYNC]
      if (syncEffects) {
         cycle.scheduleEffects(syncEffects, SYNC)
         cycle.runSyncEffects()
      }
   }
}

function assertSyncPhase(phase: Phase) {
   if (phase !== SYNC) throw new Error('First phase is not SYNC phase!')
}