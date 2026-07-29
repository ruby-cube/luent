import { __DEV__unwrap } from "@luent/utils";
import { Reaction } from "./Reaction";
import { hasQuark, QUARK } from "../abstract/Quark";
import { $activeUpdate, popUpdate, pushUpdate, Update, UpdateType } from "./Update";
import { TraceableEntity } from "../debug/Traceable";
import { Stateful } from "../abstract/Stateful";
import { createPhaseMap, Phase, phaseKeys, queueTask, RenderCycle, SYNC, TICK } from "./RenderCycle";


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
   atom.asTrackedAtom?.triggerReactions()
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

//    private reactions: Map<Phase, ReactionQueue> = new Map()
//    private phases: Phase[] = []


//    private initializePhase(phase: Phase) {
//       this.phases.push(phase)
//       const queue: ReactionQueue = new ReactionQueue(phase, this)
//       this.reactions.set(phase, queue);
//       return queue
//    }


//    /**
//      * To be called by watch() when initializing watcher
//      * @param reaction 
//      */
//    link(reaction: Reaction) {
//       (this.reactions.get(reaction.phase) ?? this.initializePhase(reaction.phase)).queue(reaction);
//    }

//    isLinked(reaction: Reaction) {
//       const reactions = (this.reactions.get(reaction.phase) ?? this.initializePhase(reaction.phase))
//       return reactions.nextLinkedReactions.has(reaction)
//    }

//    triggerReactions() { // the surrounding reaction when original trigger happened
//       const phases = this.phases
//       const cycle = $activeUpdate().cycle
//       for (const phase of phases) {
//          // console.warn('schedule reactions', phase, this.reactions.get(phase), this)
//          cycle.scheduleReactions(this.reactions.get(phase)!, phase)
//          if (phase === SYNC) {
//             console.log('run sync reactions')
//             cycle.runSyncReactions()
//          }
//       }
//    }
// }


export class Reactions {
   reactions: Set<Reaction> = new Set()

   constructor(
      public phase: Phase,
      private runReaction = (reaction: Reaction, update: Update) => {
         try {
            pushUpdate(update)
            reaction.run!()
         }
         finally {
            popUpdate()
         }
      }
   ) {

   }

   runReactions(ran: Set<Reaction>, update: Update) {
      const reactions = this.reactions;

      for (const reaction of reactions) {
         if (!reaction.run) {
            continue;
         }
         if (ran.has(reaction)) {
            this.reactions.add(reaction)
            continue;
         }
         ran.add(reaction)
         this.runReaction(reaction, update)

         if (reaction.fn) {
            this.reactions.add(reaction) // retain
         }
      }
   }

   add(reaction: Reaction) {
      this.reactions.add(reaction)
   }
}

export class TrackedAtom {

   constructor(
      public entity: Atom // needed for DEV only
   ) {

   }

   phases = phaseKeys

   reactions: { [K in typeof phaseKeys[number]]?: Reactions } = createPhaseMap()

   private getReactions(phase: Phase) {
      return this.reactions[phase] ?? (this.reactions[phase] = this.createPhaseReactions(phase))
   }

   private createPhaseReactions(phase: Phase) {
      if (phase === TICK) {
         return new Reactions(TICK, (reaction: Reaction, update: Update) => {
            requestAnimationFrame(() => {
               queueTask(() => {
                  if (!reaction.run) return;
                  const _update = new Update(
                     update.type,
                     update.timeMargin,
                     update.type === UpdateType.USER_INTERACTION ? false : update.idle // TODO: not sure about this
                  )
                  _update.queue(reaction.run).start()
               })
            })
         })
      }

      return new Reactions(phase)
   }
   /**
     * To be called by watch() when initializing watcher
     * @param reaction 
     */
   link(reaction: Reaction) {
      this.getReactions(reaction.phase).add(reaction)
      // console.log('link reaction', reaction, reaction.phase, this.reactions)
   }

   triggerReactions() {
      const phases = this.phases
      const cycle = $activeUpdate().cycle as unknown as RenderCycle
      if (__DEV__) assertSyncPhase(phases[0])
      for (let i = 1; i < phases.length; i++) {
         const phase = phases[i]
         const reactions = this.reactions[phase]
         if (!reactions) continue;
         cycle.scheduleReactions(reactions, phase)
      }
      const syncReactions = this.reactions[SYNC]
      if (syncReactions) {
         cycle.scheduleReactions(syncReactions, SYNC)
         cycle.runReactions(SYNC)
      }
   }
}

function assertSyncPhase(phase: Phase) {
   if (phase !== SYNC) throw new Error('First phase is not SYNC phase!')
}