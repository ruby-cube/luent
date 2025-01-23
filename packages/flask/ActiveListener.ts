import { Callback, CallbackRemover, useCleanupScheduler } from "./flaskableListeners";
import { getFlask, onFlaskDisposal } from "./EffectFlask";
import { PendingCancelOp } from "./PendingCancelOp";
import { setUpCleanupWarning, unmarkNoCleanup } from "./initFlask";
import { mapHandlers } from "./handlerMap";
import { isAbortSignal, AbortSignal, RegisterAbortSignal } from "./AbortSignal";
import { asyncTraceStack } from "./debug";
import { $_snap_context, $_wrap_with_, asyncContextStack } from "./context/AsyncContext";

export type ActiveListener = {
   stop(): boolean;
   pause(): boolean;
   resume(): boolean;
}

export type ScheduleStop = (stop: CallbackRemover) => PendingCancelOp;

export const LIFETIME = null;

export type ListenerOptions = {
   once?: boolean;
   until?: ScheduleStop | typeof LIFETIME | AbortSignal | any[]
   // flask?: EffectFlask | null | 'outlive';
   __devName?: string;
}

export type EnrollFunction = (wrappedCB: Callback) => any
export type RemoveFunction<E extends EnrollFunction> =
   E extends (arg: any) => infer R ?
   R extends Callback ?
   (cleanUp: R) => void
   : (forRemoval: R) => void
   : never

type ActiveListenerConfig<E extends EnrollFunction = EnrollFunction> = {
   callback: Callback,
   enroll: E,
   remove: RemoveFunction<E>,
   options: ListenerOptions | undefined
   trace_DEV?: string,
}







export function makeActiveListener<E extends (wrappedCB: Callback) => void | Callback>(
   config: ActiveListenerConfig<E>
): ActiveListener {
   const { enroll, remove, callback, options, trace_DEV } = config;
   if (!callback) {
      if (__DEV__) console.warn("No callback was passed into makeActiveListener")
      function noOp() {
         return false;
      }
      return {
         stop: noOp,
         pause: noOp,
         resume: noOp
      };
   }
   const once = options?.once;

   let returnVal: any;
   let pendingStop: PendingCancelOp | undefined
   let pendingFlaskCleanup: PendingCancelOp | undefined


   const activeListener = {
      stop: _remove,
      pause,
      resume() {
         if (stopped || !paused) return false;
         paused = false;
         returnVal = enroll(_callback);
         return true;
      }
   }

   const context = $_snap_context()

   const _callback = once ? (...args: any[]) => {
      try {
         asyncContextStack.push(context);
         if (__DEV__) asyncTraceStack?.push(trace_DEV!)
         callback(...args);
      }
      finally {
         asyncContextStack.pop()
         _remove()
      }
   } :
      (...args: any[]) => {
         try {
            asyncContextStack.push(context);
            if (__DEV__) asyncTraceStack?.push(trace_DEV!)
            callback(...args);
         }
         finally {
            asyncContextStack.pop()
         }
      }
   // (...args: any[]) => {
   //    try {
   //       if (__DEV__) asyncTraceStack?.push(trace_DEV!);
   //       callback(...args);
   //    }
   //    finally {
   //      if(__DEV__) asyncTraceStack?.pop()
   //    }
   // }

   // $_wrap_with_(context, callback);
   // const _callback = bindFlask(once ? oneTimeCallback : callback, flask === 'outlive' ? null : flask);

   mapHandlers(_callback, callback);

   let stopped = false;
   function _remove() {
      if (stopped) return false;
      stopped = true;
      remove(returnVal ?? _callback);
      if (__DEV__) unmarkNoCleanup(activeListener);
      if (pendingStop && 'cancel' in pendingStop) pendingStop.cancel();
      else if (pendingFlaskCleanup && 'cancel' in pendingFlaskCleanup) {
         pendingFlaskCleanup.cancel();
      }
      return true;
   }
   _remove.isRemover = true as const;
   _remove.__devName = options?.__devName;

   let paused = false;
   function pause() {
      if (stopped || paused) return false;
      remove(returnVal ?? _callback);
      paused = true;
      return true;
   }
   pause.isRemover = true as const;
   pause.__devName = options?.__devName;

   let until = options?.until as ScheduleStop | RegisterAbortSignal | null | undefined | any[]

   if (until instanceof Array) {
      until = useCleanupScheduler(...until)
   }

   if (until) {
      pendingStop = until(_remove);
      if (__DEV__ && (!pendingStop || pendingStop && !("cancel" in pendingStop)))
         console.warn('`until` function should be a flaskable scheduler that return a PendingCancelOp for cleanup. See @rue/flask')
   }
   else if (until !== LIFETIME) {
      pendingFlaskCleanup = onFlaskDisposal(_remove);
   }

   if (__DEV__ && until !== LIFETIME) setUpCleanupWarning!(activeListener, until, getFlask())

   returnVal = enroll(_callback);

   return activeListener as ActiveListener;
}