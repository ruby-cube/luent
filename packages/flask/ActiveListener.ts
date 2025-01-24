import { Callback, CallbackRemover, useCleanupScheduler } from "./flaskableListeners";
import { PendingCancelOp } from "./PendingCancelOp";
import { setUpCleanupWarning, unmarkNoCleanup } from "./initFlask";
import { mapHandlers } from "./handlerMap";
import { isAbortSignal, AbortSignal, RegisterAbortSignal } from "./AbortSignal";
import { asyncTraceStack } from "./debug";
import { $_snap_context, $_wrap_with_, asyncContextStack } from "./context/AsyncContext";
import { Flask, getActiveFlask, ThisFlask } from "./Flask";
import { listen } from "@rue/lumo";

export type ActiveListener = {
   stop(): boolean;
   pause(): boolean;
   resume(): boolean;
}

export type ScheduleStop = (stop: CallbackRemover) => PendingCancelOp;

export const LIFETIME = null;

export type ListenerOptions = {
   once?: boolean;
   until?: ScheduleStop | AbortSignal | any[]
   flask?: ThisFlask | null //| 'outlive';
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
   const flask = options?.flask;

   let returnVal: any;
   let cancelPendingStop: (() => void) | undefined
   let unbind: (() => void) | undefined

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

   const enclosingFlask = flask === null ? undefined : (flask || getActiveFlask()) as Flask | undefined

   const _callback = wrapWithContextAndFlask(callback, {
      afterCall: once ? _remove : undefined,
      enclosingFlask,
      trace_DEV
   })

   // once ? (...args: any[]) => {
   //    if (taskFlask) taskFlask.discard()
   //    taskFlask = enclosingFlask?.spawn() || new Flask()
   //    try {
   //       asyncContextStack.push(context);
   //       if (__DEV__) asyncTraceStack?.push(trace_DEV!)
   //       taskFlask.collectTasks(() => callback(...args))
   //    }
   //    finally {
   //       _remove()
   //       asyncContextStack.pop()
   //    }
   // } :
   //    (...args: any[]) => {
   //       if (taskFlask) taskFlask.discard()
   //       taskFlask = enclosingFlask?.spawn() || new Flask()
   //       try {
   //          asyncContextStack.push(context);
   //          if (__DEV__) asyncTraceStack?.push(trace_DEV!)
   //          taskFlask.collectTasks(() => callback(...args))
   //       }
   //       finally {
   //          asyncContextStack.pop()
   //       }
   //    }

   mapHandlers(_callback, callback);

   let stopped = false;
   function _remove() {
      if (stopped) return false;
      stopped = true;
      remove(returnVal ?? _callback);
      if (__DEV__) unmarkNoCleanup(activeListener);
      if (cancelPendingStop) cancelPendingStop();
      if (unbind) unbind();
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
      until = useCleanupScheduler(...until) // for custom cleanup, like [document, 'mouseup']
   }

   if (until) {
      const pendingStop = until(_remove);
      if (pendingStop) cancelPendingStop = pendingStop.cancel;
      if (__DEV__ && !cancelPendingStop)
         console.warn('`until` function should be a flaskable scheduler that return a PendingCancelOp for cleanup. See @rue/flask')
   }

   if (enclosingFlask) {
      unbind = bindToFlask(activeListener, enclosingFlask)
   }

   if (__DEV__ && flask !== null) setUpCleanupWarning!(activeListener, until, enclosingFlask)

   returnVal = enroll(_callback);

   return activeListener as ActiveListener;
}


function bindToFlask(listener: ActiveListener, flask: ThisFlask) {
   const { cancel: cancelStop } = flask.onDiscard(listener.stop);
   const { stop: stopPausing } = flask.onDeactivate(() => listener.pause());
   const { stop: stopResuming } = flask.onReactivate(listener.resume);

   return function unbind() {
      cancelStop()
      stopPausing()
      stopResuming()
   }
}

// currentFlask
// until
// flask


function wrapWithContextAndFlask(callback: Callback, config: {
   afterCall?: () => void,
   enclosingFlask: Flask | undefined,
   trace_DEV: string | undefined
}) {
   const { afterCall, enclosingFlask, trace_DEV } = config
   let taskFlask: Flask;

   const context = $_snap_context()

   return (...args: any[]) => {
      if (taskFlask) taskFlask.discard()
      taskFlask = enclosingFlask?.spawn() || new Flask()
      try {
         asyncContextStack.push(context);
         if (__DEV__) asyncTraceStack?.push(trace_DEV!)
         taskFlask.collectTasks(() => callback(...args))
      }
      finally {
         if (afterCall) afterCall()
         asyncContextStack.pop()
      }
   }
}