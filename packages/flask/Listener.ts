import { Callback, CallbackRemover, useCleanupScheduler } from "./flaskableListeners";
import { setUpCleanupWarning, unmarkNoCleanup } from "./initFlask";
import { mapHandlers } from "./handlerMap";
import { AbortSignal, RegisterAbortSignal } from "./AbortSignal";
import { $_snap_context, callWithContext } from "./context/AsyncContext";
import { Flask, getActiveFlask, setFlask, ThisFlask } from "./Flask";
import { setAsyncPath } from "./debug";
import { noop } from "@rue/utils";

export type ResumableListener = {
   stop(): boolean;
   pause(): boolean;
   resume(): boolean;
}

export type Listener = {
   stop(): boolean;
}


export type SustainedListenerOptions = {
   once?: boolean;
   until?: ScheduleStop | AbortSignal | null
} & ListenerOptions

export type ScheduleStop = (stop: CallbackRemover) => Listener;

export type SchedulerOptions = {
   cancel?: ScheduleStop | AbortSignal | null,
} & ListenerOptions

export type ListenerOptions = {
   within?: ThisFlask | null //| 'outlive',
   preserve?: true
}


export type EnrollFunction = (wrappedCB: Callback) => any
export type RemoveFunction<E extends EnrollFunction> =
   E extends (arg: any) => infer R ?
   R extends Callback ?
   (cleanUp: R) => void
   : (forRemoval: R) => void
   : never

export type PauseCleanup = () => void
export type Pause = () => PauseCleanup | void

type ListenerConfig<E extends EnrollFunction = EnrollFunction> = {
   callback: Callback,
   enroll: E,
   remove: RemoveFunction<E>,
   pause?: Pause,
   resume?: Function,
   options: SustainedListenerOptions | undefined
   __DEV__asyncPath?: string,
}

export function toListenerOptions(options: SchedulerOptions | undefined) {
   if (!options) return { once: true }
   return {
      once: true,
      until: options.cancel,
      within: options.within
   }
}

export function makeListener<E extends (wrappedCB: Callback) => void | Callback>(
   config: ListenerConfig<E>
): ResumableListener {
   const { enroll, remove, callback, pause, resume, options, __DEV__asyncPath } = config;
   if (!callback) {
      if (__DEV__) console.warn("No callback was passed into makeListener")
      function noOp() {
         return false;
      }
      return {
         stop: noOp,
         pause: noOp,
         resume: noOp
      };
   }
   const callbackIsRemover = isRemover(callback);
   const once = options?.once || callbackIsRemover;
   const preserve = options?.preserve || false;
   const within = options?.within;
   const flask = within instanceof ThisFlask ?
      //@ts-expect-error: flask is private
      within.flask
      : within;

   let returnVal: any;
   let cancelPendingStop: (() => void) | undefined
   let unbind: (() => void) | undefined

   const activeListener = {
      stop,
      pause: _pause,
      resume() {
         if (stopped || !paused) return false;
         paused = false;
         returnVal = enroll(_callback);
         if (resume) resume();
         return true;
      }
   }

   const enclosingFlask = flask === null ? undefined : (flask || getActiveFlask())

   const _callback = callbackIsRemover ? callback : wrapWithFlask(callback, {
      afterCall: once ? stop : undefined,
      enclosingFlask,
      __DEV__asyncPath
   })

   mapHandlers(_callback, callback);

   let stopped = false;
   function stop() {
      if (stopped) return false;
      stopped = true;
      remove(returnVal ?? _callback);
      if (__DEV__) unmarkNoCleanup(activeListener);
      if (cancelPendingStop) cancelPendingStop();
      if (unbind) unbind();
      if (pauseCleanup) pauseCleanup()
      return true;
   }
   stop.isRemover = true as const;
   // _remove.__devName = options?.__devName;


   let pauseCleanup: PauseCleanup | void;
   let paused = false;
   function _pause() {
      console.log('pausing')
      if (stopped || paused) return false;
      remove(returnVal ?? _callback);
      if (pause) pauseCleanup = pause();
      paused = true;
      return true;
   }
   // pause.isRemover = true as const;
   // pause.__devName = options?.__devName;

   let until = options?.until
   // as ScheduleStop | RegisterAbortSignal | null | undefined | any[]

   if (until instanceof Array) {
      until = useCleanupScheduler(...until) // for custom cleanup, like [document, 'mouseup']
   }

   if (until) {
      const pendingStop = until(stop);
      if (pendingStop) cancelPendingStop = pendingStop.stop;
      if (__DEV__ && !cancelPendingStop)
         console.warn('`until` function should be a flaskable scheduler that return a Pending object for cleanup. See @rue/flask')
   }

   if (enclosingFlask) {
      unbind = bindListenerToFlask(activeListener, enclosingFlask, preserve, until)
   }

   if (__DEV__ && (flask !== null || until !== null)) setUpCleanupWarning!(activeListener, until, enclosingFlask)

   returnVal = enroll(_callback);

   return activeListener as ResumableListener;
}

const noopable = {
   stop: noop
}

function bindListenerToFlask(listener: ResumableListener, flask: Flask, preserve: boolean, until: any | null) {
   const { stop: cancelStop } = until === null ? noopable : flask.onDiscard(listener.stop);
   const { stop: stopPausing } = preserve ? noopable : flask.onUnmount(listener.pause);
   const { stop: stopResuming } = preserve ? noopable : flask.onRemount(listener.resume);

   return function unbind() {
      cancelStop()
      stopPausing()
      stopResuming()
   }
}



function isRemover(callback: Callback) {
   return "isRemover" in callback && callback.isRemover;
}
// // onMount doesn't make sense for task flasks except as remount... $thisTask() instead of flask? $thisNode()

// function wrapWithFlask(callback: Callback, config: {
//    afterCall?: () => void,
//    enclosingFlask: Flask | undefined,
//    __DEV__asyncPath: string | undefined
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
   __DEV__asyncPath?: string
}) {
   const { afterCall, enclosingFlask, __DEV__asyncPath } = config
   const context = $_snap_context()
   let scene: Flask;
   return (...args: any[]) => {
      if (scene) scene.emitDiscard()
      scene = enclosingFlask?.spawn('scene') || new Flask({ type: 'scene' }) //QUESTION: Do we want callback to be called again on remount?? you should only call if dirty right?
      return callWithContext({
         context,
         beforeCall() {
            setFlask(scene)
            if (__DEV__) setAsyncPath!(__DEV__asyncPath!)
         },
         callback: () => callback(...args),
         afterCall
      })
   }
}
