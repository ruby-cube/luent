import { Callback, CallbackRemover, useCleanupScheduler } from "./flaskableListeners";
import { PendingCancelOp } from "./PendingCancelOp";
import { setUpCleanupWarning, unmarkNoCleanup } from "./initFlask";
import { mapHandlers } from "./handlerMap";
import { AbortSignal, RegisterAbortSignal } from "./AbortSignal";
import { $_snap_context, callWithContext } from "./context/AsyncContext";
import { Flask, getActiveFlask, setFlask, ThisFlask } from "./Flask";
import { setTrace } from "./debug";

export type Listener = {
   stop(): boolean;
   pause(): boolean;
   resume(): boolean;
}

export type ScheduleStop = (stop: CallbackRemover) => PendingCancelOp;

export const LIFETIME = null;

export type ListenerOptions = {
   once?: boolean;
   until?: ScheduleStop | AbortSignal | any[]
   flask?: ThisFlask | Flask | null //| 'outlive';
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
): Listener {
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
   const _flask = options?.flask;
   const flask = _flask instanceof ThisFlask ?
      //@ts-expect-error: flask is private
      _flask.flask
      : _flask;

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

   const enclosingFlask = flask === null ? undefined : (flask || getActiveFlask())

   const _callback = wrapWithFlask(callback, {
      afterCall: once ? _remove : undefined,
      enclosingFlask,
      trace_DEV
   })

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
   // pause.isRemover = true as const;
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

   return activeListener as Listener;
}


function bindToFlask(listener: Listener, flask: Flask) {
   const { cancel: cancelStop } = flask.onDiscard(listener.stop);
   const { stop: stopPausing } = flask.onDeactivate(listener.pause); 
   const { stop: stopResuming } = flask.onReactivate(listener.resume);

   return function unbind() {
      cancelStop()
      stopPausing()
      stopResuming()
   }
}

// // onActivate doesn't make sense for task flasks except as reactivate... $thisTask() instead of flask? $thisNode()

// function wrapWithFlask(callback: Callback, config: {
//    afterCall?: () => void,
//    enclosingFlask: Flask | undefined,
//    trace_DEV: string | undefined
// }) {
//    const { afterCall, enclosingFlask } = config
//    let taskFlask: Flask;
//    const context = $_snap_context()
//    return (...args: any[]) => {
//       if (taskFlask) taskFlask.discard()
//       taskFlask = enclosingFlask?.spawn() || new Flask()
//       taskFlask.activate(() => callback(...args)) //TODO: pass in dev trace
//       if (afterCall) afterCall()
//    }
// }


function wrapWithFlask(callback: Callback, config: {
   afterCall?: () => void,
   enclosingFlask?: Flask,
   trace_DEV?: string
}) {
   const { afterCall, enclosingFlask, trace_DEV } = config
   const context = $_snap_context()
   let taskFlask: Flask;
   return (...args: any[]) => {
      if (taskFlask) taskFlask.discard()
      taskFlask = enclosingFlask?.spawn() || new Flask() //QUESTION: Do we want callback to be called again on reactivate?? you should only call if dirty right?
      return callWithContext({
         context,
         beforeCall() {
            setFlask(taskFlask)
            if (__DEV__) setTrace!(trace_DEV!)
         },
         callback: () => callback(...args),
         afterCall
      })
   }
}


