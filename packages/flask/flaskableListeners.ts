import { AnyObject } from "@rue/types";
import { Listener, EnrollFunction, ListenerOptions, RemoveFunction, ScheduleStop, toListenerOptions, SchedulerOptions, makeAttendant } from "./Attendant";
import { makePendingStop, PendingStop } from "./PendingStop";
import { buildTrace_DEV } from "./debug";

export type CallbackRemover = {
   (): void;
   isRemover: true;
};

export type Callback = (...arg: any[]) => any;
export type Callbacks = Set<Callback | CallbackRemover>;


let _useCleanupScheduler: undefined | ((...args: any[]) => (cleanup: CallbackRemover) => Listener)

export function useCleanupScheduler(...args: any[]) {
   if (_useCleanupScheduler) {
      return _useCleanupScheduler(...args)
   }
}

// allows custom clean up option like { until: [document, 'click'] }
export function defineCustomCleanupScheduler(scheduler: (...args: any[]) => (cleanup: CallbackRemover) => Listener) {
   if (__DEV__ && _useCleanupScheduler) console.warn(`overriding custom cleanup scheduler`)
   _useCleanupScheduler = scheduler;
}


export function $listen<
   E extends EnrollFunction
>(
   callback: Callback,
   options: ListenerOptions,
   config: {
      enroll: E,
      remove: RemoveFunction<E>
   }
) {
   const { enroll, remove } = config;
   return makeAttendant({
      callback,
      enroll,
      remove,
      options,
      trace_DEV: __DEV__ ? buildTrace_DEV() : undefined
   })
   // const { enroll, remove } = config;

   // if (isRemover(callback)) {
   //    return makePendingStop({
   //       callback,
   //       enroll,
   //       remove
   //    }) as CB extends CallbackRemover ? PendingStop : Listener
   // }

   // return makeListener({
   //    callback,
   //    enroll,
   //    remove,
   //    options,
   //    trace_DEV: __DEV__ ? buildTrace_DEV() : undefined
   // }) as CB extends CallbackRemover ? PendingStop : Listener
}


// export type ScheduledOp<CB extends Callback> = CB extends { isRemover: true } ? PendingStop : Listener

export function $schedule<
   E extends EnrollFunction
>(callback: Callback, options: SchedulerOptions | undefined, config: {
   enroll: EnrollFunction,
   remove: RemoveFunction<E>
}) {
   const { enroll, remove } = config;
   return makeAttendant({
      callback,
      enroll,
      remove,
      options: toListenerOptions(options),
      trace_DEV: __DEV__ ? buildTrace_DEV() : undefined
   })
}



// function makeAttendant(
//    callback: Callback,
//    options: ListenerOptions,
//    config: {
//       enroll: EnrollFunction,
//       remove: RemoveFunction<any>
//    }
// ) {
//    const { enroll, remove } = config;

//    // if (isRemover(callback)) {
//    //    return makePendingStop({
//    //       callback,
//    //       enroll,
//    //       remove
//    //    })
//    // }

//    return makeListener({
//       callback,
//       enroll,
//       remove,
//       options,
//       trace_DEV: __DEV__ ? buildTrace_DEV() : undefined
//    })
// }