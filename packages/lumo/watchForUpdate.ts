import { $listen } from "@rue/flask";
import { Signal } from "../muonic/useSignalize";
import { getDependencies, useTaskQueues } from "../muonic/watch";
import { getCurrentComponent } from "./component";
import { LifecycleHooks, onUnmounted } from "./lifecycle";
import { onBeforeUpdatePhase, onUpdateComplete } from "../muonic/UpdateCycle";
import { ReactiveSignal } from "../muonic/useDerivedSignal";




export function watchForUpdate<T>(target: ReactiveSignal<T>, handler: (newValue: T, oldValue: T) => void, options: { once?: true } = {}) {
    const component = getCurrentComponent();
    if (!component || component === "root") throw Error("watchForUpdate must be called within component setup")

    // collect tracked refs and get taskQueues
    const deps = getDependencies(target)
    const taskQueues = useTaskQueues(deps, 'update')

    const _handler = (newValue: any, oldValue: any) => {
        handler(newValue, oldValue);
        if (component.hasUpdates === true) return;
        component.hasUpdates = true; // makes sure component.emit() runs only once per cycle even if many changes happen

        onBeforeUpdatePhase(() => {
            component.emit(LifecycleHooks.BEFORE_UPDATE)
        }, { once: true }) // assuming cleanup flask is set up

        onUpdateComplete(() => {
            component.emit(LifecycleHooks.UPDATED)
            component.hasUpdates = false; // resets for the next cycle
        }, { once: true })
    }

    // set up listeners
    for (const taskQueue of taskQueues) {
        $listen(_handler, { until: onUnmounted, ...options }, {
            enroll(task) {
                taskQueue.add(task)
            },
            remove(task) {
                taskQueue.delete(task)
            }
        });
    }
}