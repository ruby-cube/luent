import { SetMap, UIDGenerator } from "@rue/utils";
import { AsyncState } from "./context/AsyncContext";
import { PausableListener, SustainedListenerOptions } from "./Listener";

export const FLASK = 'flask'

export const [getActiveFlask, flaskStack] = AsyncState<Flask>(FLASK)

export function getFlask(): Flask {
   const flask = getActiveFlask()
   if (!flask) throw new Error('No flask found. Must call within the scope of a flask')
   return flask;
}


// export function pushFlask(flask: Flask) {
//    flaskStack.push(flask)
// }

// export function popFlask() {
//    flaskStack.pop()
// }

export function $thisFlask(): ThisFlask { // TODO: limit public properties and methods
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

   atRemounted(task: () => void) {
      return this.flask.onRemount(task)
   }


   atMounted(task: (initial: boolean) => void) {
      this.flask.onInitialMount(() => task(true))
      this.flask.onRemount(() => task(false))
   }

   atUnmount(task: (final: boolean) => void) {
      this.flask.onDemount(() => task(false))
      this.flask.onDiscard(() => task(true))
   }

   atDemount(task: () => void) {
      return this.flask.onDemount(task)
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


      if (outer) {
         const remountListener = outer.onRemount(() => this.emitRemount())
         const unmountListener = outer.onDemount(() => this.emitDemount())
         const discardListener = outer.onDiscard(() => this.emitDiscard())
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
      return this.on(LifecycleHook.INITIAL_MOUNT, task)
   }

   emitDemount() {
      this.emit(LifecycleHook.DEMOUNT)
   }

   onDemount(task: Task) {
      return this.on(LifecycleHook.DEMOUNT, task)
   }

   emitRemount() {
      this.emit(LifecycleHook.REMOUNT)
   }

   onRemount(task: Task) {
      return this.on(LifecycleHook.REMOUNT, task)
   }
   onDiscard(task: Task) {
      return this.on(LifecycleHook.DISCARD, task)
   }

   private on(hookName: LifecycleHook, task: Task) {
      const tasks = this.tasks
      tasks.addToSet(task, hookName)
      return {
         stop() {
            tasks.deleteFromSet(task, hookName)
         }
      }
   }

   emitDiscard() {
      this.emit(LifecycleHook.DISCARD)
      this.tasks.delete(LifecycleHook.INITIAL_MOUNT);
      this.tasks.delete(LifecycleHook.REMOUNT);
      this.tasks.delete(LifecycleHook.DEMOUNT);
      this.tasks.delete(LifecycleHook.DISCARD);
   }

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
