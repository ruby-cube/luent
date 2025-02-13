import { ResumableListener, EnrollFunction, SustainedListenerOptions, RemoveFunction, ScheduleStop, toListenerOptions, SchedulerOptions, makeListener, Listener, Pause } from "./Listener";
import { __DEV__buildAsyncPath } from "./debug";

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
      resume?: EnrollFunction,
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
      __DEV__asyncPath: __DEV__buildAsyncPath()
   })
}


export function $schedule<
   E extends EnrollFunction
>(callback: Callback, options: SchedulerOptions | undefined, config: {
   enroll: EnrollFunction,
   remove: RemoveFunction<E>,
   pause?: Pause,
   resume?: EnrollFunction,
}): Pending {
   const { enroll, remove, pause, resume } = config;
   return makeListener({
      callback,
      enroll,
      remove,
      pause,
      resume,
      options: toListenerOptions(options),
      __DEV__asyncPath: __DEV__ ? __DEV__buildAsyncPath() : undefined
   })
}

type Pending = Listener