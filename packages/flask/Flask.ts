import { SetMap, UIDGenerator } from "@rue/utils";
import { AsyncState } from "./context/AsyncContext";
import { ResumableListener, SustainedListenerOptions } from "./Listener";

export const FLASK = 'flask'

export const [getActiveFlask, flaskStack] = AsyncState<Flask>(FLASK)



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
   INITIAL_MOUNT = 'i',
   REMOUNT = 'rm',
   // MOUNT = 'm',
   // UNMOUNT = 'um',
   DEMOUNT = 'dm',
   DISCARD = 'd',
}




export class ThisFlask {
   constructor(
      protected flask: Flask
   ) {
      flask.thisFlask = this;
   }

   // get onInitialMount() {
   //    return this.flask.onInitialMount;
   // }

   // get onRemount() {
   //    return this.flask.onRemount
   // }

   atMounted(task: (initial: boolean) => void) {
      this.flask.onInitialMount(() => task(true))
      this.flask.onRemount(() => task(false))
   }

   atUnmount(task: (final: boolean) => void) {
      this.flask.onDemount(() => task(false))
      this.flask.onDiscard(() => task(true))
   }

   // get onDemount() {
   //    return this.flask.onDemount
   // }

   // get onDiscard() {
   //    return this.flask.onDiscard
   // }
}

const genUID = UIDGenerator(11)

let viewCount = 0

export class Flask {
   thisFlask?: ThisFlask
   outer?: Flask
   type?: string
   creationScopeID: string

   constructor(config: {
      outer?: Flask,
      type?: string
      creationScope?: boolean
   } = {}) {
      const { outer, type, creationScope } = config
      this.outer = outer;
      this.type = type;
      this.creationScopeID = creationScope ? genUID() : outer?.creationScopeID ?? "0"

      // Bind to this, to allow easy passing into hooks
      Object.defineProperty(this, 'onDemount', {
         value: (task: Task) => on(LifecycleHook.DEMOUNT, this, task),
         writable: false
      })
      Object.defineProperty(this, 'onRemount', {
         value: (task: Task) => on(LifecycleHook.REMOUNT, this, task),
         writable: false
      })
      Object.defineProperty(this, 'onDiscard', {
         value: (task: Task) => on(LifecycleHook.DISCARD, this, task),
         writable: false
      })
      Object.defineProperty(this, 'emitDemount', {
         value: () => this.emit(LifecycleHook.DEMOUNT),
         writable: false
      })
      Object.defineProperty(this, 'emitRemount', {
         value: () => this.emit(LifecycleHook.REMOUNT),
         writable: false
      })
      Object.defineProperty(this, 'emitDiscard', {
         value: () => {
            this.emit(LifecycleHook.DISCARD)
            this.tasks.delete(LifecycleHook.INITIAL_MOUNT);
            this.tasks.delete(LifecycleHook.REMOUNT);
            this.tasks.delete(LifecycleHook.DEMOUNT);
            this.tasks.delete(LifecycleHook.DISCARD);
         },
         writable: false
      })

      if (outer) {
         const remountListener = outer.onRemount(this.emitRemount)
         const unmountListener = outer.onDemount(this.emitDemount)
         const discardListener = outer.onDiscard(this.emitDiscard)
         this.onDiscard(() => {
            remountListener.stop()
            unmountListener.stop()
            discardListener.stop()
         })
      }
   }

   spawn(config: { type?: string, creationScope?: boolean }) {
      return new Flask({ outer: this, type: config.type, creationScope: config.creationScope });
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
   emitInitialMount() {
      if (!this.tasks.get(LifecycleHook.INITIAL_MOUNT)) return;
      this.emit(LifecycleHook.INITIAL_MOUNT)
      this.tasks.delete(LifecycleHook.INITIAL_MOUNT);
   }

   onInitialMount(task: Task) {
      return on(LifecycleHook.INITIAL_MOUNT, this, task)
   }

   emitDemount!: () => void

   onDemount!: (task: Task, options?: SustainedListenerOptions) => ResumableListener

   emitRemount!: () => void

   onRemount!: (task: Task, options?: SustainedListenerOptions) => ResumableListener

   onDiscard!: (task: Task) => ResumableListener

   emitDiscard!: () => void

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