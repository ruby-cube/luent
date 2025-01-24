import { SetMap } from "@rue/utils";
import { createStack } from "./context/AsyncContext";
import { PendingOp, SchedulerOptions } from "./PendingOp";
import { ActiveListener, ListenerOptions } from "./ActiveListener";
import { $listen, $schedule } from "./flaskableListeners";

const flaskStack = createStack<Flask>({
   name: 'flask',
   getParent(node) {
      return node?.outer;
   }
})

export function getActiveFlask() {
   return flaskStack.getCurrent()
}

export type ThisFlask = {
   [K in keyof Pick<Flask, 'discard'| 'onDiscard' | 'onActivate' | 'onDeactivate' | 'onReactivate'>]: Pick<Flask, 'discard'| 'onDiscard' | 'onActivate' | 'onDeactivate' | 'onReactivate'>[K]
}

export function $thisFlask(): ThisFlask { //TODO: limit public properties and methods
   const flask = getActiveFlask()
   if (!flask) throw new Error('no flask')
   return flask;
}

export function onFlaskDiscard(task: Task) {
   const flask = getActiveFlask();
   if (!flask) return;
   return flask.onDiscard(task);
}


type Task = () => void

export enum LifecycleHook {
   ACTIVATE = 'a',
   REACTIVATE = 'r',
   DEACTIVATE = 'bda',
   DISCARD = 'bd',
}

// export function makeDynamicNode() {
//    const parent = getActiveDynamicNode();
//    const dynamicNode = new DynamicNode(parent);
//    if (parent instanceof DynamicNode) {
//        parent.onReactivate(() => { dynamicNode.emit(LifecycleHook.ON_REACTIVATE) }, { //FIX: This makes on activated run twice when it is first activated (see if this has been fixed)
//            until: dynamicNode.onDestroy,
//        })
//        parent.onDeactivate(() => { dynamicNode.emit(LifecycleHook.ON_DEACTIVATE) }, {
//            until: dynamicNode.onDestroy,
//        })
//        parent.onDestroy(() => { dynamicNode.destroy() }, {
//            cancel: dynamicNode.onDestroy,
//            __devName: 'makeDynamicNode, onDestroy'
//        })
//    }
//    return dynamicNode;
// }


export class Flask {
   constructor(public outer?: Flask) {
      if (outer) {
         outer.onReactivate(this.reactivate, {
            until: this.onDiscard,
         })
         outer.onDeactivate(this.deactivate, {
            until: this.onDiscard,
         })
         outer.onDiscard(this.discard, {
            cancel: this.onDiscard
         })
      }
   }

   fork() {
      return new Flask(this);
   }

   tasks: SetMap<LifecycleHook, Task> = new SetMap();

   private emit(hookName: LifecycleHook) {
      const taskQueue = this.tasks.get(hookName);
      if (!taskQueue) return;
      for (const task of taskQueue) {
         task();
      }
   }

   private _activate?: () => void

   get activate() {
      return this._activate || (this._activate = () => this.emit(LifecycleHook.ACTIVATE))
   }

   private _onActivate?: (task: Task, options?: SchedulerOptions) => PendingOp<void>

   get onActivate() {
      return this._onActivate || (this._onActivate = (task: Task, options?: SchedulerOptions) => at(LifecycleHook.ACTIVATE, this, task, options))
   }
   //TODO: include option that uses onActivate as onReactivate as well {onReactivate: true}

   private _discard?: () => void

   get discard() {
      return this._discard || (this._discard = () => this.emit(LifecycleHook.DISCARD))
   }

   private _onDiscard?: (task: Task, options?: SchedulerOptions) => PendingOp<void>

   get onDiscard() {
      return this._onDiscard || (this._onDiscard = (task: Task, options?: SchedulerOptions) => at(LifecycleHook.DISCARD, this, task, options))
   }

   private _deactivate?: () => void

   get deactivate() {
      return this._deactivate || (this._deactivate = () => this.emit(LifecycleHook.DEACTIVATE))
   }

   private _onDeactivate?: (task: Task, options?: ListenerOptions) => ActiveListener

   get onDeactivate() {
      return this._onDeactivate || (this._onDeactivate = (task: Task, options?: ListenerOptions) => on(LifecycleHook.DEACTIVATE, this, task, options))
   }
   //TODO: include option that uses onDeactivate as onDiscard as well {onDiscard: true}

   private _reactivate?: () => void

   get reactivate() {
      return this._reactivate || (this._reactivate = () => this.emit(LifecycleHook.REACTIVATE))
   }

   private _onReactivate?: (task: Task, options?: ListenerOptions) => ActiveListener

   get onReactivate() {
      return this._onReactivate || (this._onReactivate = (task: Task, options?: ListenerOptions) => on(LifecycleHook.REACTIVATE, this, task, options))
   }

   collectTasks<T>(fn: () => T) {
      try {
         flaskStack.push(this);
         return fn();
      }
      finally {
         flaskStack.pop();
      }
   }
}


// export function collectEffects<T>(run: (flask: Flask, outerFlask: Flask | null) => T) {
//    try {
//       const flask = new Flask();
//       pushFlask(flask);
//       return run(flask, flask.outer || null);
//    }
//    catch {
//       popFlask();
//    }
// }


//@ts-ignore
//const newFlask = flask.fork()




function at(hookName: LifecycleHook, flask: Flask, task: Task, options: SchedulerOptions = {}) {
   const tasks = flask.tasks

   return $schedule(task, {...options, flask: null}, { //QUESTION: I don't know if binding to a flask will cause an infinite loop of cleanup or if not binding will cause memory leak
      enroll(task) {
         tasks.addToSet(task, hookName)
      },
      remove(handler) {
         tasks.deleteFromSet(task, hookName)
      }
   });
}

function on(hookName: LifecycleHook, flask: Flask, task: Task, options: ListenerOptions = {}) {
   const tasks = flask.tasks

   return $listen(task, { /* until: flask.onDiscard,  */...options, flask: null }, {
      enroll(handler) {
         tasks.addToSet(handler, hookName)
      },
      remove(handler) {
         tasks.deleteFromSet(handler, hookName)
      }
   });
}