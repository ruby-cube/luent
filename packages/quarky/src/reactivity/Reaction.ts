import { __DEV__unwrap, noop } from "@luent/utils";
import { TrackedAtom } from "./Atom";
import { Phase } from "./RenderCycle";


type TaskFn = (...args: any[]) => unknown

export class Reaction {
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


// let reactionStackCount = 0;

// export class ReactionQueue {
//    reactions: Reaction[] | undefined;
//    nextReactions: Reaction[] = []
//    nextLinkedReactions: Set<Reaction> = new Set()
//    retained: Set<Reaction> = new Set()

//    constructor(
//       private phase: Phase,
//       private atom?: TrackedAtom
//    ) {

//    }

//    *runReactions(run: (reaction: Reaction) => void, completed: Set<Reaction> | undefined, process?: CycleProcess, onComplete: () => void = noop) {
//       const reactions = this.nextReactions
//       this.nextReactions = []
//       this.nextLinkedReactions = new Set()
//       const phase = this.phase
//       const sync = phase === SYNC

//       const limit = reactions.length
//       console.log('>>> running phase', phase, 'of', this.atom, '# of reactions:', limit)
//       for (let i = 0; i < limit; i++) {
//          const reaction = reactions[i]
//          if (
//             !reaction.run // weeds out reactions that have been unlinked due to retracking
//          ) {
//             console.log('!reaction.run', reaction.fn)
//             continue;
//          }
//          // prevent repeats within queue (but not across extended queues and phases)
//          if (completed?.has(reaction)) {
//             console.log('completed?.has(reaction)', reaction.fn)
//             this.retain(reaction)
//             continue;
//          }

//          try {
//             reactionStackCount++
//             if (reactionStackCount > 100_000) throw new Error('Infinite loop detected')
//             run(reaction)
//          }
//          // catch (err) {
//          //    catchCancelledUpdate(err)
//          // }
//          finally {
//             reactionStackCount--
//             completed?.add(reaction)
//             if (phase !== SYNC) this.retain(reaction)
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

//       if (sync && reactionStackCount !== 0) {
//          return;
//       }

//       this.reactions = undefined
//       this.retained.clear()
//       onComplete()
//    }

//    retain(reaction: Reaction) {
//       if (this.retained.has(reaction) || !reaction.run) return;
//       this.nextReactions.push(reaction)
//       this.nextLinkedReactions.add(reaction)
//       this.retained.add(reaction)
//    }

//    /**
//    * To be called by observe() when initializing observer
//    * @param reaction 
//    */
//    queue(reaction: Reaction) {
//       this.nextLinkedReactions.add(reaction)
//       this.nextReactions.push(reaction)
//    }

//    requeued: boolean = false;
//    queued: boolean = false
// }



// /**
//  * Belongs to the current reaction cycle.
//  */
// export class TaskQueue {
//    moreReactions: ReactionQueue[] | undefined;
//    reactions: ReactionQueue[] = []
//    tasks: (() => void)[] = []

//    cancel!: () => void;

//    started = false;

//    runReaction(reaction: Reaction) {
//       reaction.run?.()
//    }

//    constructor(
//       public update: Update,
//       protected phase: Phase
//    ) {
//    }

//    scheduleTask(task: () => void) {
//       this.tasks.push(task)
//    }

//    scheduleReactions(reactions: ReactionQueue) {
//       if (this.runningReactions && !reactions.requeued) {
//          reactions.requeued = true;
//          const extension = this.moreReactions ?? (this.moreReactions = [])
//          extension.push(reactions)
//       }
//       else if (!reactions.queued) {
//          this.reactions.push(reactions)
//          reactions.queued = true;
//       }
//       else console.warn('NOTHING', reactions.queued, reactions.requeued)
//    }

//    runningReactions: boolean = false
// }

