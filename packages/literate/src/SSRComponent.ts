import { EffectFlask } from "@rue/flask"
import { PublicComponent } from "@rue/lumo"
import { AnyObject } from "@rue/types"
import { Literate } from "./Literate"
import { Component } from "../../lumo/src/component/componentStack"

export enum LifecycleHook {
    SETUP_COMPLETED = 'sc'
}

export type SSRComponentSetup<P = any> = P extends never ?
    (() => Literate | Promise<SSRComponent>) | (() => [PublicComponent, Literate]) :
    ((props: P) => Literate | Promise<SSRComponent>) | ((props: P) => [PublicComponent, Literate])

export class SSRComponent<T extends AnyObject = AnyObject> implements Component {
    flask!: EffectFlask
    setFlask(flask: EffectFlask) {
        this.flask = flask
    }

    constructor(
        public parent: SSRComponent | null,
    ) {
    }
    // strings!: string[];
    // values!: any[];
    output!: Literate | Promise<SSRComponent>
    component!: PublicComponent | null

    initialize(output: Literate | Promise<SSRComponent>, component: PublicComponent | null) {
        this.output = output
        this.component = component
    }

    #tasks: {
        [LifecycleHook.SETUP_COMPLETED]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.SETUP_COMPLETED]: undefined,
        };

    #getTaskQueue(hookName: LifecycleHook) {
        let taskQueue = this.#tasks[hookName]
        return taskQueue;
    }

    emit(hookName: LifecycleHook) {
        const taskQueue = this.#getTaskQueue(hookName);
        if (!taskQueue) return;
        for (const task of taskQueue) {
            task();
        }
    }
}