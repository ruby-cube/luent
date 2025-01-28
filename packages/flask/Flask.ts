import { SetMap } from "@rue/utils";
import { ContextualState } from "./context/AsyncContext";
import { PendingOp, SchedulerOptions } from "./PendingOp";
import { Listener, ListenerOptions } from "./Listener";
import { $listen, $schedule } from "./flaskableListeners";

export const [getActiveFlask, setFlask, flaskStack] = ContextualState<Flask>('flask')



// export function pushFlask(flask: Flask) {
//    flaskStack.push(flask)
// }

// export function popFlask() {
//    flaskStack.pop()
// }

export function $thisFlask(): ThisFlask { //TODO: limit public properties and methods
   const flask = getActiveFlask()
   if (!flask) throw new Error('No flask found. Must call within the scope of a flask')
   return flask.thisFlask || new ThisFlask(flask);
}

type Task = () => void

enum LifecycleHook {
   MOUNT = 'a',
   UNMOUNT = 'bda',
   REMOUNT = 'r',
   DISCARD = 'bd',
}

export class ThisFlask {
   constructor(
      protected flask: Flask
   ) {
      flask.thisFlask = this;
   }

   onMount(cb: (initial: boolean) => void) {
      this.flask.onMount(() => cb(true))
      this.flask.onRemount(() => cb(false))
   }

   onUnmount(cb: (final: boolean) => void) {
      this.flask.onUnmount(() => cb(false))
      this.flask.onDiscard(() => cb(true))
   }
}


export class Flask {
   thisFlask?: ThisFlask
   outer?: Flask
   type?: string

   constructor(config: {
      outer?: Flask,
      type?: string
   } = {}) {
      const { outer, type } = config
      this.type = type;

      // Bind to this, to allow easy passing into hooks
      Object.defineProperty(this, 'onUnmount', {
         value: (task: Task, options?: ListenerOptions) => on(LifecycleHook.UNMOUNT, this, task, options),
         writable: false
      })
      Object.defineProperty(this, 'onRemount', {
         value: (task: Task, options?: ListenerOptions) => on(LifecycleHook.REMOUNT, this, task, options),
         writable: false
      })
      Object.defineProperty(this, 'onDiscard', {
         value: (task: Task, options?: SchedulerOptions) => at(LifecycleHook.DISCARD, this, task, options),
         writable: false
      })
      Object.defineProperty(this, 'unmount', {
         value: () => this.emit(LifecycleHook.UNMOUNT),
         writable: false
      })
      Object.defineProperty(this, 'remount', {
         value: () => this.emit(LifecycleHook.REMOUNT),
         writable: false
      })
      Object.defineProperty(this, 'discard', {
         value: () => this.emit(LifecycleHook.DISCARD),
         writable: false
      })

      if (outer) {
         outer.onRemount(this.remount, {
            until: this.onDiscard,
         })
         outer.onUnmount(this.unmount, {
            until: this.onDiscard,
         })
         outer.onDiscard(this.discard, {
            cancel: this.onDiscard
         })
      }
   }

   spawn(type?: string) {
      return new Flask({ outer: this, type });
   }

   tasks: SetMap<LifecycleHook, Task> = new SetMap();

   private emit(hookName: LifecycleHook) {
      const taskQueue = this.tasks.get(hookName);
      if (!taskQueue) return;
      for (const task of taskQueue) {
         task();
      }
   }

   // Because mount doesn't have a reason to be passed into other hooks as a callback, no need to bind to this.
   mount() {
      this.emit(LifecycleHook.MOUNT)
   }

   onMount(task: Task, options?: SchedulerOptions) {
      at(LifecycleHook.MOUNT, this, task, options)
   }

   onDiscard!: (task: Task, options?: SchedulerOptions) => PendingOp<void>

   discard!: () => void

   unmount!: () => void

   onUnmount!: (task: Task, options?: ListenerOptions) => Listener

   remount!: () => void

   onRemount!: (task: Task, options?: ListenerOptions) => Listener

   containCall(fn: () => any) {
      try {
         flaskStack.push(this);
         return fn();
      }
      finally {
         flaskStack.pop()
      }
   }
}

function at(hookName: LifecycleHook, flask: Flask, task: Task, options: SchedulerOptions = {}) {
   const tasks = flask.tasks

   return $schedule(task, { /* until: flask.onDiscard,  */...options, within: null }, {
      enroll(task) {
         tasks.addToSet(task, hookName)
      },
      remove(task) {
         tasks.deleteFromSet(task, hookName)
      }
   });
}

function on(hookName: LifecycleHook, flask: Flask, task: Task, options: ListenerOptions = {}) {
   const tasks = flask.tasks

   return $listen(task, { /* until: flask.onDiscard,  */...options, within: null }, {
      enroll(task) {
         tasks.addToSet(task, hookName)
      },
      remove(task) {
         tasks.deleteFromSet(task, hookName)
      }
   });
}