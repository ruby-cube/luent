import { $_wrap_with_context, $listen, $schedule, AsyncState, Flask, getActiveFlask, getFlask, Listener, ListenerOptions, SchedulerOptions } from "@rue/flask";
import { CyclePhase, EffectCycle, Phase, queueTask, SYNC } from "./EffectCycle";
import { createOneoff, Effect } from "./EffectQueue";
import { WatchedAtom } from "../watch/WatchedAtom";

const [getActiveCycleManager, cycleManagerStack] = AsyncState<EffectCycleManager>('cycle-manager')

type EffectCycleHook = (task: () => void, options?: SchedulerOptions) => Listener //Should this be void?

export class EffectCycleManager {
   constructor(
      public name: string,
      public timeMargin: number = 100,
      public initialLoad: number | undefined = undefined
   ) {
   }

   // private tasks: Map<Phase, TaskQueue> = new Map()

   // private initializeQueue(phase: Phase) {
   //    const queue: TaskQueue = new TaskQueue()
   //    this.tasks.set(phase, queue);
   //    return queue
   // }

   // scheduleTask(task: TaskRef, phase: Phase) {
   //    this.current // ensures there will be an effect cycle to run the tasks;
   //    const queue = this.tasks.get(phase) ?? this.initializeQueue(phase);
   //    queue.scheduleTask(task)
   // }

   // runTasks(phase: Phase) {
   //    this.tasks.get(phase)?.runTasks()
   // }

   // count: number = 0;

   // private nextCycle: EffectCycle | undefined
   // private currentCycle: EffectCycle | undefined

   // get next() {
   //    return this.nextCycle ?? (this.nextCycle = this.createCycle())
   // }

   // get current() {
   //    return this.currentCycle ?? (this.currentCycle = this.initCycle())
   // }

   // createCycle() {
   //    this.count++;
   //    return new EffectCycle(this);
   // }

   // initCycle() {
   //    const cycle = this.createCycle()
   //    schedulePhase(cycle, this.phases[0])
   //    return cycle;
   // }

   // closeCycle() {
   //    const cycle = this.currentCycle = this.nextCycle
   //    if (cycle) {
   //       // queueTask(()=>{ //TODO: must not queueTask for animation, but need it for others?
   //       this.nextCycle = undefined;
   //       schedulePhase(cycle, this.phases[0])
   //       // })
   //    }
   // }

   phases: CyclePhase[] = []

   onComplete!: EffectCycleHook

   pushPhase(phase: CyclePhase) {
      phase.phases = this.phases;
      phase.index = this.phases.length
      this.phases.push(phase);
   }
}

// export function isAnimationCycle(cycle: EffectCycle) {
//    return cycle.manager.name === 'AnimationCycle'
// }

// export function isLazyCycle(cycle: EffectCycle) {
//    // return cycle.manager.name !== 'AnimationCycle'
//    return cycle.manager.name === 'LazyCycle'
// }


export function schedulePhase(cycle: EffectCycle, { index, schedule, next, phases }: CyclePhase) {
   schedule(() => {
      cycle.currentPhase = index;
      cycle.subphase = 'effects'
      updateStack.push(cycle.update)
      const running = cycle.runEffects(index) //TODO: returns promise for async effects, must coordinate with pendingPrerender
      cycle.subphase = 'microtasks'
      updateStack.pop()

      if (cycle.pendingPrerender) {
         cycle.pendingPrerender.then(closePhase) // delays scheduling next phase until prerender is complete
         cycle.pendingPrerender = undefined
      }
      else {
         closePhase()
      }

      function closePhase() {
         const final = index === phases.length - 1;
         if (final || cycle.cancelled) {
            cycle.close()
         }
         else schedulePhase(cycle, next)
      }
   })
}



//TODO:
// [X] sync effects
// [X] preventing infinite loop chains, but allow effects to be triggered further down the pipeline with updated state
//     - prevention should be stopped at '$ion.state = x', do not allow effects that trigger previously triggered state by that effect chain to run
// [X] Set up base rendering effect cycle
// [ ] doAction integration
// [ ] state locks
// [ ] Set up lazy effect queue (needs to check if action was canceled)
// [ ] Set up animation queue

// function queueResponsive(fn: IdleRequestCallback) {
//    return requestIdleCallback($_wrap_with_context(fn), { timeout: 17 })
// }

const cycleManager = new EffectCycleManager('UpdateCycle', 100, 1000);

function setUpUpdateCycleManager() {
   cycleManager.pushPhase(new CyclePhase('PRERENDER', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase('INTERNAL_RENDER', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase('RENDER', queueMicrotask))
   cycleManager.pushPhase(new CyclePhase('INTERNAL_POSTRENDER', queueMicrotask))
   return cycleManager;
}

// const animationCycleManager = new EffectCycleManager('AnimationCycle', 16.7);

// export function setUpAnimationCycleManager() {
//    animationCycleManager.pushPhase(new CyclePhase('ANIMATION:PRERENDER', queueMicrotask))
//    animationCycleManager.pushPhase(new CyclePhase('ANIMATION:INTERNAL_RENDER', queueMicrotask))
//    animationCycleManager.pushPhase(new CyclePhase('ANIMATION:RENDER', queueMicrotask))
//    animationCycleManager.pushPhase(new CyclePhase('ANIMATION:POSTRENDER', queueMicrotask))
//    return animationCycleManager;
// }

// export function useLazyCycleManager(timeMargin: number) {
//    const lazyActionCycleManager = new EffectCycleManager('LazyCycle', timeMargin);

//    lazyActionCycleManager.pushPhase(new CyclePhase('LAZY:PRERENDER', queueMicrotask))
//    lazyActionCycleManager.pushPhase(new CyclePhase('LAZY:INTERNAL_RENDER', queueMicrotask))
//    lazyActionCycleManager.pushPhase(new CyclePhase('LAZY:RENDER', queueMicrotask))
//    lazyActionCycleManager.pushPhase(new CyclePhase('LAZY:POSTRENDER', queueMicrotask))
//    return lazyActionCycleManager;
// }

// export class LazyAction {
//    cycle: EffectCycle = $currentOrNextCycle(lazyActionCycleManager)
// }



//TODO: need to manage which cycle manager is going to be used.
// - do we need separate cycle managers for each lazy update? yes.
// - how do we access the appropriate cycle manager? async context? 

// const lazyEffectCycleManagers: Record<number, EffectCycleManager> = {}

// let lazyUpdate: false | number = false;

export function isLazyUpdate() {
   return !!(getActiveUpdate()?.lazy)
   // return lazyUpdate || $currentCycleManager().name === 'LazyCycle' //FIX: temporary
}

// export let queueUpdate: (fn: () => void)=> void

let UPDATE_PHASE = 3; //TODO: need to register

// //NOTE: TEMPORARY till i find a better solution
// export function queueUpdate(fn: () => void) {
//    const effect = createOneoff(fn, UPDATE_PHASE)
//    $currentCycle().scheduleEffect(effect)
//    getFlask().onDiscard(() => effect.destroy())
//    //FIX: getFlask will fail if you set state in any non-flasked async fn (e.g. setTimeout, setInterval..  unless I use the compiler to auto-provide async context)
// }

//QUESTION: do scheduled effects need to be discarded with flask? closest flask? view flask? scene?
// - yes, that is how you cancel an effect if you close/change the view before the effect renders
// - scene flask? Yes, if you nest a queueInternalRender in an effect, the effect is run and then run again, we want to override the first queueInternalRender.
// CONCLUSION: discard with closest flask

// export function useLazyUpdateA(timeMargin: number = Infinity) {
//    const manager = lazyEffectCycleManagers[timeMargin] ?? (lazyEffectCycleManagers[timeMargin] = useLazyCycleManager(timeMargin))

//    return function upd<T>(fn: () => T): Promise<T> {
//       const cycle = manager.current;
//       const promise = cycle.pendingPrerender = new Promise((resolve) => { cycle.resolvePrerender = resolve })
//       //NOTE: assumes one cycle per lazy call... is this what I want? no... I need a promise.all but for now, let's just use one promise

//       try {
//          lazyUpdate = timeMargin; // assuming function is synchronous. Need AsyncState for asynchronous
//          cycle.lazyResult = fn()
//          return promise as Promise<T>
//       }
//       finally {
//          lazyUpdate = false;
//       }
//    }
// }




// export function getUpdateCycleCount() {
//    return cycleManager.count
// }


type EffectCycleHooks = {
   SYNC: typeof SYNC,
} & {
   [key: string]: Phase
} & {
   // onEffectCycleComplete: EffectCycleHook
}

export function useReactivitySystem(): EffectCycleHooks {
   const cycleManager = setUpUpdateCycleManager()

   const hooks = {
      SYNC,
      // onEffectCycleComplete: cycleManager.onComplete
   }

   addHooks(hooks, cycleManager)
   return hooks as EffectCycleHooks;
}

// export function useAnimationCycle(): EffectCycleHooks {
//    const manager = setUpAnimationCycleManager();
//    const hooks = {
//       SYNC
//    }
//    addHooks(hooks, manager)
//    return hooks as EffectCycleHooks;
// }

function addHooks(hooks: { [key: string]: string | any }, cycle: EffectCycleManager) {
   const phases = cycle.phases
   for (const phase of phases) {
      const phaseName = phase.name
      // hooks[phaseName] = phaseName
      hooks[phaseName] = phase.index
      phase.phaseHook = cycle.name + ':' + phaseName
   }
}



/**
 * Library API
 * 
 * @param phase 
 * @returns 
 */
// export function createEffectCycleHook(phase: Phase) {
//    return (task: () => void, options?: ListenerOptions) => {
//       const update = $activeUpdate()
//       return $listen(task, options ?? {}, { //TODO: potentially get rid of $listen depending on typical usage
//          enroll(fn) {
//             const effect = new Effect(fn, phase)
//             update.effectCycle.scheduleEffect(effect)
//             return effect;
//          },
//          remove(task) {
//             task.discard()
//          }
//       })
//    }
// }

/**
 * Library API
 * 
 * @param phase 
 * @returns 
 */
export function createEffectCycleScheduler(phase: Phase) {
   return (task: () => void, options?: SchedulerOptions) => {
      const update = $activeUpdate()
      return $schedule(task, options ?? {}, { //TODO: potentially get rid of $listen depending on typical usage
         enroll(task) {
            const effect = new Effect(task, phase)
            update.cycle.scheduleEffect(effect)
            return effect;
         },
         remove(effect: Effect) {
            effect.destroy()
         }
      })
   }
}



/**
 * TEMPORARY
 * @returns 
 */
export function $currentOrNextCycle() {
   // return cycleManager.current;
   // const phase = getCurrentPhase(cycleManager)
   // if (phase !== SYNC) {
   //    return cycleManager.next;
   // }
   // return cycleManager.current;
   return $activeUpdate().cycle
}

// export function $currentCycle(cycleManager = $currentCycleManager()) {
//    return cycleManager.current;
// }


// export function $currentCycleManager() {
//    // return cycleManager;
//    if ($forAnimation()) return animationCycleManager;
//    if (lazyUpdate) return lazyEffectCycleManagers[lazyUpdate]
//    return getActiveCycleManager() ?? cycleManager; //TODO: instead of using activeManager, getActiveManager via AsyncContext
// }


export function getDefaultPhase() {
   const currentPhase = getCurrentPhase()
   if (currentPhase !== SYNC) return currentPhase
   return 'postrender' // POST_RENDER
}



// export function getEffectCycleManager() {
//    return cycleManager
// }


// export function $currentEffectCycle() {
//    return cycleManager.current
// }

export function getCurrentPhase() {
   const update = getActiveUpdate()
   if (!update) return SYNC;
   return update.cycle.currentPhase;
   // if (cycleManager.current && cycleManager.current.currentPhase !== SYNC) return cycleManager.current.currentPhase;
   // return SYNC;
}


// export function getAnimationCycleManager() {
//    return animationCycleManager
// }


// export function $currentAnimationCycle() {
//    return animationCycleManager.current
// }

// export function getCurrentAnimationPhase() {
//    if (animationCycleManager.current && animationCycleManager.current.currentPhase !== SYNC) return animationCycleManager.current.currentPhase;
//    return SYNC;
// }


// updateManager

//TODO: createApp and dynamic rendering nodes (conditionals and iteratives) need to create updates

export class Update {
   constructor(
      public timeMargin: number = 0,
      private flask: Flask,
      public lazy: boolean = false
   ) {
      if (timeMargin === 1000) console.log('new update')
   }

   atoms: Set<WatchedAtom> = new Set()

   cycle: EffectCycle = new EffectCycle(this, cycleManager.phases)

   queue(commitUpdate: () => void) {
      const effect = createOneoff(commitUpdate, UPDATE_PHASE)
      this.cycle.scheduleEffect(effect)
      this.flask.onDiscard(() => effect.destroy())
      this.commits.push(effect)
   }

   private commits: Effect[] = []

   cancel() {
      this.commits.forEach(commit => commit.destroy())
      this.cycle.cancel()
   }
}



// class UpdatePriority {
//    queue: Update[] = []
//    constructor(
//       public timelimit: number
//    ) { }
// }

// function createUpdatePriority(timelimit: number) {
//    return inert(new UpdatePriority(timelimit))
// }

// class UpdateManager {

//    updatePriorities: UpdatePriority[] = ionize([createUpdatePriority(16.7), createUpdatePriority(100)])

//    addUpdatePriority(timelimit: number) {
//       const updatePriorities = this.updatePriorities
//       const updatePriority = createUpdatePriority(timelimit)
//       if (updatePriorities.at(-1)!.timelimit < timelimit) {
//          updatePriorities.push(updatePriority)
//       }
//       else if (timelimit < updatePriorities[0].timelimit) {
//          updatePriorities.unshift(updatePriority)
//       }
//       else {
//          let i = updatePriorities.length - 1;
//          while (i--) {
//             const priority = updatePriorities[i]
//             if (priority.timelimit < timelimit) {
//                updatePriorities.splice(i + 1, 0, updatePriority)
//                break;
//             }
//          }
//       }
//       return updatePriority;
//    }
// }

// const updateManager = new UpdateManager()

// const updatePrioritiesMap: Record<number, Ion<number>> = {
//    [16.7]: $UpdatePriority(16.7),
//    [100]: $UpdatePriority(100),
// }

// function $UpdatePriority(timelimit: number) {
//    return ion(() => updateManager.updatePriorities.findIndex(item => item.timelimit === timelimit))
// }

// function $updatePriority(timelimit: number) {
//    const $priority = updatePrioritiesMap[timelimit] ?? (updatePrioritiesMap[timelimit] = $UpdatePriority(timelimit))
//    return $priority();
// }

export const updateStack: Update[] = [];

export function getActiveUpdate() {
   return updateStack.at(-1)
}

export function $activeUpdate() {
   const update = getActiveUpdate()
   if (!update) throw new Error('Must be called within update context')
   return update;
}

export function initUpdate(timeMargin: number = 0, lazy: boolean = false) {
   return getActiveUpdate() ?? new Update(timeMargin, getFlask(), lazy);
}

// const updatePriority = updateManager.updatePriorities[timeMargin] ?? updateManager.addUpdatePriority(timeMargin)
// const queue = updatePriority.queue;

export function update<T>(fn: () => T, options?: { timeMargin?: number, lazy?: number }): Promise<T> {
   // const update =  new Update(timeMargin, getFlask());
   const timeMargin = options?.lazy ?? options?.timeMargin ?? 100;
   const update = initUpdate(timeMargin, !!(options?.lazy)) //FIX: because Interval wraps context, the loading update is passed down
   const cycle = update.cycle
   const promise = cycle.pendingPrerender = new Promise((resolve) => { cycle.resolvePrerender = resolve })
   //NOTE: assumes one cycle per lazy call... is this what I want? no... I need a promise.all but for now, let's just use one promise

   try {
      updateStack.push(update)
      // lazyUpdate = timeMargin; // assuming function is synchronous. Need AsyncState for asynchronous
      cycle.lazyResult = fn()
      return promise as Promise<T>
   }
   finally {
      updateStack.pop()
      // lazyUpdate = false;
   }
}

