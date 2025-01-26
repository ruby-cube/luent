import { SetMap } from "@rue/utils";
import { $_snap_context, asyncContextStack, ContextualState } from "./context/AsyncContext";
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

export enum LifecycleHook {
   // ACTIVATE = 'a',
   DEACTIVATE = 'bda',
   REACTIVATE = 'r',
   DISCARD = 'bd',
}

export class ThisFlask {
   constructor(
      private flask: Flask
   ) {
      flask.thisFlask = this;
   }

   get discard() {
      return this.flask.discard
   }

   get onDiscard() {
      return this.flask.onDiscard
   }

   // get onDeactivate() {
   //    return this.flask.onDeactivate
   // }

   // get onReactivate() {
   //    return this.flask.onReactivate
   // }
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

   // private _activate?: () => void

   // get activate() {
   //    return this._activate || (this._activate = () => this.emit(LifecycleHook.ACTIVATE))
   // }

   // private _onActivate?: (task: Task, options?: SchedulerOptions) => PendingOp<void>

   // get onActivate() {
   //    return this._onActivate || (this._onActivate = (task: Task, options?: SchedulerOptions) => at(LifecycleHook.ACTIVATE, this, task, options))
   // }

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

   private _onDeactivate?: (task: Task, options?: ListenerOptions) => Listener

   get onDeactivate() {
      return this._onDeactivate || (this._onDeactivate = (task: Task, options?: ListenerOptions) => on(LifecycleHook.DEACTIVATE, this, task, options))
   }
   //TODO: include option that uses onDeactivate as onDiscard as well {onDiscard: true}

   private _reactivate?: () => void

   get reactivate() {
      return this._reactivate || (this._reactivate = () => this.emit(LifecycleHook.REACTIVATE))
   }

   private _onReactivate?: (task: Task, options?: ListenerOptions) => Listener

   get onReactivate() {
      return this._onReactivate || (this._onReactivate = (task: Task, options?: ListenerOptions) => on(LifecycleHook.REACTIVATE, this, task, options))
   }

   // open() {
   //    flaskStack.push(this)
   // }

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

   return $schedule(task, { ...options, flask: null }, { //QUESTION: I don't know if binding to a flask will cause an infinite loop of cleanup or if not binding will cause memory leak
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