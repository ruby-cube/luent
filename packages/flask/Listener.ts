import { $listen, Callback, CallbackRemover, useCleanupScheduler } from "./flaskableListeners";
import { setUpCleanupWarning, unmarkNoCleanup } from "./initFlask";
import { $_run_with_, $_snap_context, asyncContextStack, ContextSnapshot, } from "./context/AsyncContext";
import { FLASK, Flask, getActiveFlask, ThisFlask } from "./Flask";
import { TRACE } from "./debug";
import { noop, __DEV__unwrap } from "@luent/utils";
import { AnyObject } from "@luent/types";

type A = { [K in keyof AbortSignal]: AbortSignal[K] }['removeEventListener']

// TODO: make sure abort signal can be used generically and not just for events
type _AbortSignal = {
   readonly aborted: boolean;
   readonly reason: any;
   onabort: ((this: AbortSignal, ev: Event) => any) | null; // handleAbort/remove function
   throwIfAborted: {
      (): void;
      (): void;
   };
   addEventListener: {
      <K extends keyof AbortSignalEventMap>(type: K, removeHandlers: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
      (type: string, onAbort: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
   };
   removeEventListener: {
      <K extends keyof AbortSignalEventMap>(type: K, removeHandlers: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
      (type: string, onAbort: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
   };
   dispatchEvent: (event: Event) => boolean;
}

export type PausableListener = {
   stop(): boolean;
   pause(): boolean;
   resume(): boolean;
}

export type Listener = {
   stop(): boolean;
}

export type Until = ScheduleStop | AbortSignal | null

export type SustainedListenerOptions = {
   once?: boolean;
   until?: Until
} & ListenerOptions

export type ScheduleStop = (stop: CallbackRemover) => Listener;

export type SchedulerOptions = {
   cancel?: Until,
} & ListenerOptions

export type ListenerOptions = {
   eager?: boolean;
   within?: ThisFlask | null //| 'outlive',
}


export type EnrollFunction = (wrappedCB: Callback) => any
export type RemoveFunction<E extends EnrollFunction> =
   E extends (arg: any) => infer R ?
   R extends Callback ?
   (cleanUp: R) => void
   : (forRemoval: R) => void
   : never

export type PauseCleanup = () => void
export type Pause = (arg: any) => PauseCleanup | void

type ListenerConfig<E extends EnrollFunction = EnrollFunction> = {
   callback: Callback,
   enroll: E,
   remove: RemoveFunction<E>,
   options: SustainedListenerOptions | undefined
   __DEV__asyncPath?: string,
}

export function toListenerOptions(options: SchedulerOptions | undefined) {
   if (!options) return { once: true }
   return {
      once: true,
      eager: options.eager,
      until: options.cancel,
      within: options.within
   }
}


export function makeScheduler<E extends (wrappedCB: Callback) => void | Callback>(
   config: ListenerConfig<E>
): Listener {
   const { enroll, remove, callback, options } = config;
   if (!callback) {
      if (__DEV__) console.warn("No callback was passed into makeListener")
      return {
         stop() { return false; }
      };
   }

   const listener = {
      stop
   }
   let eager = Boolean(options?.eager)

   const effect: { run: Callback | null } = { // wrap callback in object so it doesn't cause memory leak
      run: (...args: any[]) => {
         if (!effect.run) return;
         const returnVal = runCallback(args)
         if (!eager) stop()
         eager = false;
         return returnVal
      }
   }

   const flask = getFlask(options?.within)
   const enclosingFlask = flask === null ? undefined : (flask || getActiveFlask())
   const context = $_snap_context()

   function runCallback(args: any[]) {
      $_run_with_(context, () => callback(...args), { [FLASK]: enclosingFlask, [TRACE]: config.__DEV__asyncPath ?? "" })
   }

   const until = options?.until
   const returnVal: any = enroll(effect.run!);

   const unbind = bindToFlask(listener, until, enclosingFlask)

   function stop() {
      return stopListener(listener, effect, () => remove(returnVal ?? effect.run), unbind)
   }
   stop.isRemover = true as const;

   setUpCleanup(until, stop, listener, flask, enclosingFlask)

   return listener;
}

function bindToFlask(listener: Listener, until: Until | undefined, enclosingFlask: Flask | undefined) {
   return (until === null || !enclosingFlask) ? undefined : enclosingFlask.onDiscard(listener.stop).stop
}


function getFlask(within: ThisFlask | null | undefined) {
   return within instanceof ThisFlask ?
      //@ts-expect-error: flask is private
      within.flask
      : within;
}


export function makeListener<E extends (wrappedCB: Callback) => void | Callback>(
   config: ListenerConfig<E>
): Listener {
   const { enroll, remove, callback, options } = config;
   if (!callback) {
      if (__DEV__) console.warn("No callback was passed into makeListener")
      return {
         stop() { return false; }
      };
   }

   const listener = {
      stop
   }

   const effect: { run: Callback | null } = { // wrap callback in object so it doesn't cause memory leak
      run: (...args: any[]) => {
         if (!effect.run) return;
         return runCallback(args)
      }
   }

   const flask = getFlask(options?.within)
   const enclosingFlask = flask === null ? undefined : (flask || getActiveFlask())
   const context = $_snap_context()
   let scene: Flask;

   function runCallback(args: any[]) {
      if (scene) scene.emitDiscard()
      scene = enclosingFlask?.spawn({ type: 'scene', creationScope: true }) || new Flask({ type: 'scene', creationScope: true })
      $_run_with_(context, () => callback(...args), {
         [FLASK]: scene,
         [TRACE]: config.__DEV__asyncPath ?? ""
      })
   }

   const until = options?.until
   const returnVal: any = enroll(effect.run!);

   const unbind = bindToFlask(listener, until, enclosingFlask)

   function stop() {
      return stopListener(listener, effect, () => remove(returnVal ?? effect.run), unbind)
   }
   stop.isRemover = true as const;

   setUpCleanup(until, stop, listener, flask, enclosingFlask)

   return listener;
}

function noOp() {
   return false;
}

export function makePausableListener<E extends (wrappedCB: Callback) => void | Callback>(
   config: ListenerConfig<E>
): PausableListener {
   const { enroll, remove, callback, options } = config;
   if (!callback) {
      if (__DEV__) console.warn("No callback was passed into makeListener")

      return {
         stop: noOp,
         pause: noOp,
         resume: noOp
      };
   }

   let paused = false;
   let dirty = false;
   const activeListener = {
      stop,
      pause() {
         if (!effect.run || paused) return false;
         paused = true;
         dirty = false;
         return true;
      },
      resume() {
         if (!effect.run || !paused) return false;
         paused = false;
         if (dirty) effect.run()
         return true;
      }
   }

   const pausableTask = (args: any[]) => {
      if (paused) {
         dirty = true;
         return;
      }
      dirty = false;
      return callback(...args)
   }


   const effect: { run: Callback | null } = { // wrap callback in object so it doesn't cause memory leak
      run: (...args: any[]) => {
         if (!effect.run) return;
         return runCallback(args)
      }
   }

   const flask = getFlask(options?.within)
   const enclosingFlask = flask === null ? undefined : (flask || getActiveFlask())
   const context = $_snap_context()
   let scene: Flask;

   function runCallback(args: any[]) {
      if (scene) scene.emitDiscard()
      scene = enclosingFlask?.spawn({ type: 'scene', creationScope: true }) || new Flask({ type: 'scene', creationScope: true }) //QUESTION: Do we want callback to be called again on remount?? you should only call if stale right?

      $_run_with_(context, () => pausableTask(args), {
         [FLASK]: scene,
         [TRACE]: config.__DEV__asyncPath ?? ""
      })
   }

   const returnVal: any = enroll(effect.run!);

   const until = options?.until

   const unbind = enclosingFlask ? bindListenerToFlask(activeListener, enclosingFlask, until) : undefined // batch cleanup

   function stop() {
      return stopListener(activeListener, effect, () => remove(returnVal ?? effect.run), unbind)
   }
   stop.isRemover = true as const;

   setUpCleanup(until, stop, activeListener, flask, enclosingFlask)

   return activeListener as PausableListener;
}

function setUpCleanup(until: Until | undefined, stop: CallbackRemover, listener: Listener, flask: Flask | null | undefined, enclosingFlask: Flask | undefined) {
   const success = _setUpCleanup(until, stop)
   if (__DEV__ && (flask !== null || success)) setUpCleanupWarning!(listener, until, enclosingFlask)
}

function _setUpCleanup(until: Until | undefined, stop: CallbackRemover) {
   if (until === null) return true;
   if (!until) return false;
   if (until instanceof AbortSignal) {
      until.onabort = stop;
      return true;
   }
   if (Array.isArray(until)) {
      until = useCleanupScheduler(...until) // for custom cleanup, like [document, 'mouseup']
   }
   if (until) {
      until(stop);
      return true;
   }


}

const noopable = {
   stop: noOp
}

function bindListenerToFlask(listener: PausableListener, flask: Flask, until: any | null) {
   const { stop: cancelStop } = until === null ? noopable : flask.onDiscard(listener.stop);
   const { stop: stopPausing } = flask.onDemount(listener.pause);
   const { stop: stopResuming } = flask.onRemount(listener.resume);

   return function unbind() {
      cancelStop()
      stopPausing()
      stopResuming()
   }
}

type Effect = { run: null | Callback }

function stopListener(listener: Listener, effect: Effect, remove: () => void, unbind: (() => void) | undefined) {
   if (!effect.run) return false;
   remove();
   if (__DEV__) unmarkNoCleanup(listener);
   unbind?.();
   effect.run = null;
   return true;
}

function isRemover(callback: Callback) {
   return "isRemover" in callback && callback.isRemover;
}
// // onMount doesn't make sense for task flasks except as remount... $thisTask() instead of flask? $thisNode()




function wrapTask(callback: Callback, config: {
   context: ContextSnapshot,
   stop: () => boolean,
   enclosingFlask?: Flask,
   __DEV__asyncPath?: string
}) {
   const { context, enclosingFlask, stop } = config;

   function wrapped(...args: any[]) {
      $_run_with_(context, () => callback(...args), {
         [FLASK]: enclosingFlask,
         [TRACE]: config.__DEV__asyncPath ?? ""
      })
      stop()
   }
   if (__DEV__) wrapped.__DEV__fn = __DEV__unwrap(callback)
   return wrapped
}



// [] schedulers do not need a flask--they can just use the outer flask
// [] 





// $listen((...args: any[]) => { }, {
//    once: true,
//    preserve: true, // relevant to pausable listeners only
//    until: (...task: any) => { }, // TODO: don't require Listener
//    within: null
// }, {
//    enroll(cb) {
//       document.addEventListener('click', cb)
//    },
//    remove(cb) {
//       document.removeEventListener('click', cb)
//    }
// })





// pausable listener
// listener
// scheduler (listeners with once)