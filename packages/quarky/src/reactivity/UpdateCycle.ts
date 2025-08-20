import { setImmediate } from "@rue/thread";
import { createOneoff, Effect, EffectQueue, PhaseQueue } from "./EffectQueue";
import { WatchedAtom } from "./WatchedAtom";
import { $schedule, SchedulerOptions } from "@rue/flask";



interface ICyclePhase {
   name: string
   index: number
   schedule: Function
   canLaze: boolean
   next: ICyclePhase | undefined
}

type PhaseConfig = {
   name: string,
   scheduler?: Function,
   canLaze?: boolean,
   default?: true
}

type PhaseEnum = {
   SYNC: typeof SYNC,
   POSTCYCLE: number
} & {
   [key: string]: Phase
}

export type Phase = number | typeof SYNC

export const SYNC = 'SYNC' as const

export let phases: ICyclePhase[] = [{ name: 'Update', schedule: queueMicrotask, index: 0, canLaze: false, next: undefined }]

let _defaultPhase: Phase = SYNC

const defaultPhases = phases;

/**
 * @public API for libraries and frameworks
 */
export function configureUpdateCycle(config: { phases: PhaseConfig[], defaultPhase?: string }) {
   const { phases: updatePhases, defaultPhase } = config
   if (__DEV__ && phases !== defaultPhases) console.warn('Reconfiguring update cycle phases from', [...phases], 'to', updatePhases)

   phases = []

   const Phase: PhaseEnum = {
      SYNC,
      POSTCYCLE: updatePhases.length
   }

   for (const phase of updatePhases) {
      const cyclePhase = addPhase.apply(phases, [phase])
      Phase[phase.name] = cyclePhase.index
   }

   if (defaultPhase) _defaultPhase = Phase[defaultPhase]

   return Phase;
}

function addPhase(this: ICyclePhase[], config: PhaseConfig) {
   const { name, scheduler = queueMicrotask, canLaze = false } = config
   const phase = new CyclePhase(name, this.length, scheduler, canLaze, this)
   this.push(phase);
   return phase;
}

export class CyclePhase implements ICyclePhase {
   constructor(
      public name: string,
      public index: number,
      public schedule: Function,
      public canLaze: boolean,
      private phases: ICyclePhase[]
   ) { }

   get next(): ICyclePhase | undefined {
      return this.phases[this.index + 1]
   }
}


/**
 * @internal
 */

export class Update {

   constructor(
      public timeMargin: number = 0,
      public lazy: boolean = false
   ) {
      this.cycle = new UpdateCycle(this)
   }

   atoms: Set<WatchedAtom> = new Set()

   cycle: UpdateCycle;

   onComplete(commitUpdate: () => void) {
      const effect = createOneoff(commitUpdate, this.cycle.phases.length - 1)
      this.cycle.scheduleEffect(effect)
      // this.flask.onDiscard(() => (console.trace('discarding commit'), effect.destroy())) //TODO: Make sure we don't need this line
      this.commits.push(effect)
   }

   private commits: Effect[] = []

   cancel() {
      this.commits.forEach(commit => commit.destroy())
      this.cycle.cancel()
      this.cancelTasks.forEach(task => task())
      this.cancelTasks = []
   }

   private cancelTasks: (() => void)[] = []

   onCancel(task: () => void) {
      this.cancelTasks.push(task)
   }
}


/**
 * @internal
 */

export class UpdateCycle {

   currentPhase: Phase = SYNC

   phases: ICyclePhase[]

   startTime = performance.now()

   constructor(
      public update: Update,
   ) {
      this.phases = phases // from module
      this.schedulePhase(phases[0]) // from module
   }

   schedulePhase({ index, schedule, next }: ICyclePhase) {
      schedule(() => {
         this.currentPhase = index;
         this.subphase = 'effects'
         pushUpdate(this.update) // from module
         const running = this.runEffects(index) //TODO: returns promise for async effects, must coordinate with pendingPreupdate
         this.subphase = 'microtasks'
         popUpdate() // from module

         if (this.pendingPreupdate) {
            this.pendingPreupdate.then(() => this.closePhase(next)) // delays scheduling next phase until prerender is complete
            this.pendingPreupdate = undefined
         }
         else {
            this.closePhase(next)
         }
      })
   }

   closePhase(nextPhase: ICyclePhase | undefined) {
      if (!nextPhase || this.cancelled) {
         this.close()
      }
      else this.schedulePhase(nextPhase)
   }

   idleIDs: number[] = []

   cancelled: boolean = false;

   cancel() {
      this.idleIDs.forEach((id) => cancelIdleCallback(id))
      this.cancelled = true;
   }

   // private closingTasks: (() => void)[] = []

   // onClose(task: () => void) {
   //    this.closingTasks.push(task)
   // }

   close() {
      const delta = performance.now() - this.startTime
      const timeMargin = this.update.timeMargin
      if (timeMargin && delta > timeMargin) console.warn('Interaction-to-update time exceeds', timeMargin, 'ms:', delta)
      // this.closingTasks.forEach(task => task())
   }

   private effects: Map<Phase, EffectQueue> = new Map(); // pass in an object to constructor instead of map

   // effectStack: Set<Effect> = new Set()

   private initializeQueue(phase: Phase) {
      const queue: EffectQueue = new EffectQueue(this, phase)
      this.effects.set(phase, queue);
      return queue
   }

   scheduleEffects(effects: PhaseQueue, phase: Phase) {
      const adjustedPhase = this.adjustPhase(phase)
      // if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
      queue.scheduleEffects(effects)
   }

   scheduleEffect(effect: Effect) {
      // if ($currentCycle().manager.name === 'UpdateCycle') console.trace('wrong cycle?')
      const phase = effect.phase
      const adjustedPhase = this.adjustPhase(phase)
      // if (__DEV__ && adjustedPhase !== phase) console.warn('RESEARCH: phase has been adjusted', phase, adjustedPhase)
      const queue = this.effects.get(adjustedPhase) ?? this.initializeQueue(adjustedPhase);
      queue.scheduleEffect(effect)
   }

   subphase: 'effects' | 'microtasks' = 'effects'

   runningEffects: boolean = false;

   runEffects(phase: Phase) {
      // this.currentPhase = phase;
      // this.subphase = 'effects'
      const queue = this.effects.get(phase);
      this.runningEffects = true
      const promise = queue?.runEffects(this)
      this.runningEffects = false
      return promise
      // this.subphase = 'microtasks'
   }

   adjustPhase(phase: Phase) {
      // if (phase === SYNC) return SYNC;
      return this.currentPhase === phase ? phase
         : phase === SYNC ? this.currentPhase
            : this.currentPhase === SYNC ? phase : phase > this.currentPhase ? phase : this.currentPhase
   }

   pendingPreupdate?: Promise<void>;
   resolvePreupdate?: (result: any) => void
   preupdateCount: number = 0;
   lazyResult: unknown
}


export const queueTask = setImmediate;




/**
 * Library API
 * 
 * @param phase 
 * @returns 
 */
export function useUpdateCycleScheduler(phase: Phase) {
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

const updateStack: Update[] = [];

export function pushUpdate(update: Update) {
   return updateStack.push(update)
}

export function popUpdate() {
   return updateStack.pop()
}

export function getActiveUpdate() {
   return updateStack.at(-1)
}

export function isLazyUpdate() {
   return !!(getActiveUpdate()?.lazy)
}

/**
 * TEMPORARY
 * @returns 
 */
export function $currentCycle() {
   return initUpdate().cycle
}

export function getDefaultPhase() { //TODO: should be configured
   const currentPhase = getCurrentPhase()
   if (currentPhase !== SYNC) return currentPhase
   return _defaultPhase;
}

export function getAdjustedPhase(phase: Phase) {
   return phase === phases.length ? phases.length - 1 : phase;
}

export function getCurrentPhase() {
   const update = getActiveUpdate()
   if (!update) return SYNC;
   return update.cycle.currentPhase;
}

type Task = () => void

export function maybePostcycleTask(task: Task, phase: Phase) {
   return phase === phases.length ? postcycleTask(task) : task;
}

function postcycleTask(task: Task) {
   function delayed() { //TODO: need to cancel with action
      const id = requestIdleCallback(task, { timeout: 18 })
      // $action().onCancel(()=>cancelIdleCallback(id))
   }
   if (__DEV__) delayed.__DEV__fn = task;
   return delayed;
}


export function $activeUpdate() {
   const update = getActiveUpdate()
   if (!update) throw new Error('Must be called within update context')
   return update;
}

export function createUpdate(timeMargin: number = 0, lazy: boolean = false) {
   return new Update(timeMargin, lazy);
}

export function initUpdate(timeMargin: number = 0, lazy: boolean = false) {
   return getActiveUpdate() ?? new Update(timeMargin, lazy);
}



//TODO: return type should be based on options--whether it's lazy
export function update<T, OPT>(fn: () => T, options?: { timeMargin?: number, lazy?: number }): Promise<T> | T {
   const timeMargin = options?.lazy ?? options?.timeMargin ?? 100;
   const update = initUpdate(timeMargin, !!(options?.lazy)) //FIX: because Interval wraps context, the loading update is passed down
   const cycle = update.cycle
   const promise = cycle.pendingPreupdate = update.lazy ? new Promise((resolve) => { cycle.resolvePreupdate = resolve }) : undefined
   //NOTE: assumes one cycle per lazy call... is this what I want? no... I need a promise.all but for now, let's just use one promise

   try {
      pushUpdate(update)
      // lazyUpdate = timeMargin; // assuming function is synchronous. Need AsyncState for asynchronous
      const result = cycle.lazyResult = fn()
      return update.lazy ? promise as Promise<T> : result
   }
   finally {
      popUpdate()
      // lazyUpdate = false;
   }
}