import { RegisterAbortSignal } from "./AbortSignal";
import { getActiveFlask, ThisFlask } from "./Flask";
import { CallbackRemover, useCleanupScheduler } from "./flaskableListeners";
import { mapHandlers } from "./handlerMap";
import { setUpCleanupWarning, unmarkNoCleanup } from "./initFlask";
import { PendingStop } from "./PendingStop";

export type PendingOp<T = unknown> = Promise<T> & { // QUESTION: Is there any real reason for schedulers to return promises??
   stop(): void;
}


// export const NEVER = null;

export type SchedulerOptions = {
   cancel?: ScheduleCancel | AbortSignal,
   within?: ThisFlask | null //| 'outlive',
}

export type ScheduleCancel = (cancel: CallbackRemover) => PendingStop;


export class Cancellation {
   reason: string | Error | undefined;
   constructor(reason?: string | Error) {
      this.reason = reason;
   }
}



export function makePendingOp<CB extends (...arg: any[]) => any>(config: {
   callback: CB,
   enroll: (callback: CB) => any,
   remove: (cbOrReturnVal: (() => any) | any) => void,
   options: SchedulerOptions | undefined
}): PendingOp<ReturnType<CB>> {
   const { callback, enroll, remove, options } = config;
   let scheduleCancellation = options?.cancel as ScheduleCancel | RegisterAbortSignal | null | undefined | any[]

   if (scheduleCancellation instanceof Array) {
      scheduleCancellation = useCleanupScheduler(...scheduleCancellation)
   }
   // const flask = options?.flask

   let returnVal: any;
   let _resolve: (result?: any) => void;
   let pendingOp: PendingOp<ReturnType<CB>>
   let pendingCancelOp: PendingStop | null;
   let pendingFlaskCleanup: PendingStop | undefined;

   const _callback = oneTimeCallback as CB
   // const _callback = bindFlask(oneTimeCallback, flask === 'outlive' ? null : flask) as CB

   mapHandlers(_callback, callback);

   function oneTimeCallback(...arg: any[]) {
      let output: any;
      try {
         output = callback(...arg)
      }
      finally {
         _resolve(output);
         _remove()
      }
      return output;
   }

   function _remove() {
      remove(returnVal ?? _callback);
      if (__DEV__) unmarkNoCleanup(pendingOp);
      if (pendingCancelOp) pendingCancelOp.cancel();
      if (pendingFlaskCleanup) pendingFlaskCleanup.cancel();
   }

   returnVal = enroll(_callback);
   pendingOp = new Promise((resolve) => {
      _resolve = resolve;
   }) as PendingOp<ReturnType<CB>>

   let called = false;
   const cancel = (() => {
      if (called) return;
      _remove();
      _resolve(new Cancellation("Pending op canceled."))
      called = true;
   }) as CallbackRemover;
   cancel.isRemover = true as const; // Serves as a marker to indicate it should run only once if passed into a listener.

   pendingOp.stop = cancel;

   if (scheduleCancellation) {
      pendingCancelOp = scheduleCancellation ? scheduleCancellation(cancel) : null;
   }

   const flask = options?.flask
   if (flask !== null) {
      pendingFlaskCleanup = onFlaskDiscard(cancel)
   }

   if (__DEV__ && flask !== null) setUpCleanupWarning!(pendingOp, scheduleCancellation, getActiveFlask())

   return pendingOp;
}

