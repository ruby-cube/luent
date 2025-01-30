import { SetMap } from "@rue/utils";
import { ContextualState } from "./context/AsyncContext";
import { ResumableListener, SustainedListenerOptions } from "./Listener";

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

   onMounted(task: (initial: boolean) => void) {
      this.flask.onMounted(() => task(true))
      this.flask.onRemounted(() => task(false))
   }

   onUnmount(task: (final: boolean) => void) {
      this.flask.onUnmount(() => task(false))
      this.flask.onDiscard(() => task(true))
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
         value: (task: Task) => on(LifecycleHook.UNMOUNT, this, task),
         writable: false
      })
      Object.defineProperty(this, 'onRemounted', {
         value: (task: Task) => on(LifecycleHook.REMOUNT, this, task),
         writable: false
      })
      Object.defineProperty(this, 'onDiscard', {
         value: (task: Task) => on(LifecycleHook.DISCARD, this, task),
         writable: false
      })
      Object.defineProperty(this, 'emitUnmount', {
         value: () => this.emit(LifecycleHook.UNMOUNT),
         writable: false
      })
      Object.defineProperty(this, 'emitRemounted', {
         value: () => this.emit(LifecycleHook.REMOUNT),
         writable: false
      })
      Object.defineProperty(this, 'emitDiscard', {
         value: () => {
            this.emit(LifecycleHook.DISCARD)
            this.tasks.delete(LifecycleHook.MOUNT);
            this.tasks.delete(LifecycleHook.REMOUNT);
            this.tasks.delete(LifecycleHook.UNMOUNT);
            this.tasks.delete(LifecycleHook.DISCARD);
         },
         writable: false
      })

      if (outer) {
         const remountListener = outer.onRemounted(this.emitRemounted)
         const unmountListener = outer.onUnmount(this.emitUnmount)
         const discardListener = outer.onDiscard(this.emitDiscard)
         this.onDiscard(()=>{
            remountListener.stop()
            unmountListener.stop()
            discardListener.stop()
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
   emitMounted() {
      if (!this.tasks.get(LifecycleHook.MOUNT)) return;
      console.log('mount flask', this.tasks.get(LifecycleHook.MOUNT))
      this.emit(LifecycleHook.MOUNT)
      this.tasks.delete(LifecycleHook.MOUNT);
   }

   onMounted(task: Task) {
      return on(LifecycleHook.MOUNT, this, task)
   }

   onDiscard!: (task: Task) => ResumableListener

   emitDiscard!: () => void

   emitUnmount!: () => void

   onUnmount!: (task: Task, options?: SustainedListenerOptions) => ResumableListener

   emitRemounted!: () => void

   onRemounted!: (task: Task, options?: SustainedListenerOptions) => ResumableListener

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

// function at(hookName: LifecycleHook, flask: Flask, task: Task) {
//    const tasks = flask.tasks

//    $schedule(task, { /* until: flask.onDiscard,  */...options, within: null }, {
//       enroll(task) {
//          tasks.addToSet(task, hookName)
//       },
//       remove(task) {
//          tasks.deleteFromSet(task, hookName)
//       }
//    });
// }

// function on(hookName: LifecycleHook, flask: Flask, task: Task) {
//    const tasks = flask.tasks

//    $listen(task, { /* until: flask.onDiscard,  */...options, within: null }, {
//       enroll(task) {
//          tasks.addToSet(task, hookName)
//       },
//       remove(task) {
//          tasks.deleteFromSet(task, hookName)
//       }
//    });
// }

function on(hookName: LifecycleHook, flask: Flask, task: () => void) {
   const tasks = flask.tasks
   tasks.addToSet(task, hookName)
   return {
      stop() {
         tasks.deleteFromSet(task, hookName)
      }
   }
}