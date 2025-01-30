import { ResumableListener, EnrollFunction, SustainedListenerOptions, RemoveFunction, ScheduleStop, toListenerOptions, SchedulerOptions, makeListener, Listener, Pause } from "./Listener";
import { buildTrace_DEV } from "./debug";

export type CallbackRemover = {
   (): void;
   isRemover: true;
};

export type Callback = (...arg: any[]) => any;
export type Callbacks = Set<Callback | CallbackRemover>;


let _useCleanupScheduler: undefined | ((...args: any[]) => (cleanup: CallbackRemover) => ResumableListener)

export function useCleanupScheduler(...args: any[]) {
   if (_useCleanupScheduler) {
      return _useCleanupScheduler(...args)
   }
}

// allows custom clean up option like { until: [document, 'click'] }
export function defineCustomCleanupScheduler(scheduler: (...args: any[]) => (cleanup: CallbackRemover) => ResumableListener) {
   if (__DEV__ && _useCleanupScheduler) console.warn(`overriding custom cleanup scheduler`)
   _useCleanupScheduler = scheduler;
}



export function $listen<
   E extends EnrollFunction
>(
   callback: Callback,
   options: SustainedListenerOptions,
   config: {
      enroll: E,
      remove: RemoveFunction<E>,
      pause?: Pause,
      resume?: Function,
   }
) {
   const { enroll, remove, pause, resume } = config;
   return makeListener({
      callback,
      enroll,
      remove,
      pause,
      resume,
      options,
      trace_DEV: __DEV__ ? buildTrace_DEV() : undefined
   })
}


export function $schedule<
   E extends EnrollFunction
>(callback: Callback, options: SchedulerOptions | undefined, config: {
   enroll: EnrollFunction,
   remove: RemoveFunction<E>,
   pause?: Pause,
   resume?: Function,
}): Pending {
   const { enroll, remove, pause, resume } = config;
   return makeListener({
      callback,
      enroll,
      remove,
      pause,
      resume,
      options: toListenerOptions(options),
      trace_DEV: __DEV__ ? buildTrace_DEV() : undefined
   })
}

type Pending = Listener