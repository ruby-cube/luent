import { AnyObject } from "@rue/types";
import { ActiveListener, EnrollFunction, ListenerOptions, makeActiveListener, RemoveFunction, ScheduleStop } from "./ActiveListener";
import { makePendingCancelOp, PendingCancelOp } from "./PendingCancelOp";
import { makePendingOp, PendingOp, ScheduleCancel, SchedulerOptions } from "./PendingOp";
import { buildTrace_DEV, asyncTraceStack } from "./debug";

export type SustainedTargetedListener<T = any, CB extends Callback = Callback, O extends AnyObject = {}> = <
   OPT extends ListenerOptions & O,
>(target: T, callback: CB, options?: OPT) => ActiveListener;



export type CallbackRemover = {
   (): void;
   isRemover: true;
};

export type Callback = (...arg: any[]) => any;
export type Callbacks = Set<Callback | CallbackRemover>;
export type ScheduleRemoval = ScheduleCancel | ScheduleStop;


let _useCleanupScheduler: undefined | ((...args: any[]) => (cleanup: CallbackRemover) => PendingCancelOp)

export function useCleanupScheduler(...args: any[]) {
   if (_useCleanupScheduler) {
      return _useCleanupScheduler(...args)
   }
}

export function defineCustomCleanupScheduler(scheduler: (...args: any[]) => (cleanup: CallbackRemover) => PendingCancelOp) {
   if (__DEV__ && _useCleanupScheduler) console.warn(`overriding custom cleanup scheduler`)
   _useCleanupScheduler = scheduler;
}


export function $listen<
   CB extends Callback,
   E extends EnrollFunction
>(
   callback: CB,
   options: ListenerOptions,
   config: {
      enroll: E,
      remove: RemoveFunction<E>
   }
): CB extends CallbackRemover ? PendingCancelOp : ActiveListener {
   const { enroll, remove } = config;

   if (isRemover(callback)) {
      return makePendingCancelOp({
         callback,
         enroll,
         remove
      }) as CB extends CallbackRemover ? PendingCancelOp : ActiveListener
   }

   return makeActiveListener({
      callback,
      enroll,
      remove,
      options,
      trace_DEV: __DEV__ ? buildTrace_DEV() : undefined
   }) as CB extends CallbackRemover ? PendingCancelOp : ActiveListener
}


export type ScheduledOp<CB extends Callback> = CB extends { isRemover: true } ? PendingCancelOp : PendingOp<ReturnType<CB>>

export function $schedule<
   CB extends Callback,
   E extends EnrollFunction
>(callback: CB, options: SchedulerOptions | undefined, config: {
   enroll: EnrollFunction,
   remove: RemoveFunction<E>
}): ScheduledOp<CB> {
   const { enroll, remove } = config;

   if (isRemover(callback)) {
      return makePendingCancelOp({
         callback,
         enroll,
         remove
      }) as ScheduledOp<CB>
   }

   return makePendingOp({
      callback,
      enroll,
      remove,
      options
   }) as ScheduledOp<CB>
}

function isRemover(callback: Callback) {
   return "isRemover" in callback && callback.isRemover;
}

