import { $thisFlask, Flask, getActiveFlask } from "@rue/flask";

export function getActiveDynamicNode() {
   const flask = getActiveFlask();
   if (flask instanceof DynamicNode) return flask;
   if (flask instanceof Scene) return flask.dynamicNode;
   throw new Error('no dynamic node found')
}

export function getDynamicNode(): DynamicNode {
   const flask = $thisFlask()
   if (flask instanceof DynamicNode) return flask;
   if (flask instanceof Scene) return flask.dynamicNode;
   throw new Error('no dynamic node found')
}

export class DynamicNode extends Flask {

   constructor(
      public parent?: DynamicNode,
   ) {
      super(parent)
      // this.count = count++;
      // console.trace('new dynamic node', this.count)
      //   this.onDiscard = (handler: () => void, options?: SchedulerOptions) => at(LifecycleHook.DISPOSAL, this, handler, options)
      //   this.onDeactivate = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.DEACTIVATION, this, handler, options)
      //   this.onReactivate = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.REACTIVATION, this, handler, options)
   }

   override fork() {
      return new DynamicNode(this)
   }

   //  tasks: SetMap<LifecycleHook, Task> = new SetMap();

   //  private emit(hookName: LifecycleHook) {
   //    const taskQueue = this.tasks.get(hookName);
   //    if (!taskQueue) return;
   //    for (const task of taskQueue) {
   //       task();
   //    }
   // }

   mount(render: () => void) {
      // pushDynamicNode(this);
      // collectEffects((flask) => {
      //    this.setFlask(flask)
      //    render()
      // }, render.name)
      // popDynamicNode();
      // this.emit(LifecycleHook.CREATION)
      this.collectTasks(render)
      this.activate()
   }

   remount(render: () => void) {
      render();
      this.reactivate()
   }

   //  reactivate(remount: () => void) {
   //      this.emit(LifecycleHook.REACTIVATION)
   //      remount();
   //  }

   //  deactivate() {
   //      this.emit(LifecycleHook.DEACTIVATION)
   //  }

   //  unmount() {
   //      const nodeVine = this.nodeVine;
   //      if (!nodeVine) {
   //          throw new Error("No nodeVine :( nodeVine was never set or already destroyed by hook cascade (not sure if this is problematic yet. It might be when differentiating create, mount, and show)")
   //      }
   //      nodeVine.forEach((node) => {
   //          node.remove();
   //      })
   //  }

   //  discard() {
   //    //   this.unmount();
   //      this.emit(LifecycleHook.DISPOSAL) // this stops all onReactivate and onDeactivate listeners that are set to go until discard
   //      this.flask?.discard()
   //    //   this.nodeVine = undefined
   //      this.flask = undefined
   //      this.parent = null
   //      //TODO: clear or null all tasks??
   //  }

   //  onCreated?: (handler: () => void, options?: SchedulerOptions) => PendingOp<void>
   //  onDiscard: (handler: () => void, options?: SchedulerOptions) => PendingOp<void>
   //  onDeactivate: (handler: () => void, options?: ListenerOptions) => ActiveListener
   //  onReactivate: (handler: () => void, options?: ListenerOptions) => ActiveListener

   //  initializeOnCreatedHook() {
   //      if (this.onCreated) return this.onCreated;
   //      return this.onCreated = (handler: () => void, options?: SchedulerOptions) => at(LifecycleHook.CREATION, this, handler, options)
   //  }

   // initializeOnDestroyHook() {
   //     if (this.onDiscard) return this.onDiscard;
   //     return this.onDiscard = (handler: () => void, options?: SchedulerOptions) => at(LifecycleHook.ON_DESTROY, this, handler, options)
   // }

   // initializeOnDeactivateHook() {
   //     if (this.onDeactivate) return this.onDeactivate;
   //     this.initializeOnDestroyHook()
   //     return this.onDeactivate = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.ON_DEACTIVATE, this, handler, options)
   // }

   // initializeOnActivatedHook() {
   //     if (this.onReactivate) return this.onReactivate;
   //     this.initializeOnDestroyHook()
   //     return this.onReactivate = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.ON_REACTIVATE, this, handler, options)
   // }


   // private tasks: SetMap<LifecycleHook, Task> = new SetMap();



   //  private at(hookName: LifecycleHook, handler: () => void, options: SchedulerOptions = {}) {
   //     const tasks = this.tasks

   //     return $schedule(handler, options, {
   //        enroll(handler) {
   //           tasks.addToSet(handler, hookName)
   //        },
   //        remove(handler) {
   //           tasks.deleteFromSet(handler, hookName)
   //        }
   //     });
   //  }

   //  private on(hookName: LifecycleHook, handler: () => void, options: ListenerOptions = {}) {
   //     const tasks = this.tasks

   //     return $listen(handler, { until: this.onDiscard, ...options }, {
   //        enroll(handler) {
   //           tasks.addToSet(handler, hookName)
   //        },
   //        remove(handler) {
   //           tasks.deleteFromSet(handler, hookName)
   //        }
   //     });
   //  }
}

// function at(hookName: LifecycleHook, node: DynamicNode, handler: () => void, options: SchedulerOptions = {}) {
//     const tasks = node.tasks

//     return $schedule(handler, options, {
//         enroll(handler) {
//             tasks.addToSet(handler, hookName)
//         },
//         remove(handler) {
//             tasks.deleteFromSet(handler, hookName)
//         }
//     });
// }

// function on(hookName: LifecycleHook, node: DynamicNode, handler: () => void, options: ListenerOptions = {}) {
//     const tasks = node.tasks

//     return $listen(handler, { until: node.onDiscard, ...options }, {
//         enroll(handler) {
//             tasks.addToSet(handler, hookName)
//         },
//         remove(handler) {
//             tasks.deleteFromSet(handler, hookName)
//         }
//     });
// }

export const NULLISH_DYNAMIC_NODE = new DynamicNode()








