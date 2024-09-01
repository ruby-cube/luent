import { EffectFlask } from "@rue/flask"
import { PublicComponent } from "@rue/lumo"
import { AnyObject } from "@rue/types"
import { Literate } from "./Literate"
import { TreeNode } from "../../lumo/src/component/componentStack"

export enum LifecycleHook {
    ON_CREATED = 'sc'
}

export type SSRComponentSetup<P extends AnyObject | undefined = undefined, E extends AnyObject | undefined = undefined> =
    P extends undefined ?
    E extends undefined ? (() => Literate | Promise<SSRComponent>)
    : (() => [E, Literate])
    : E extends undefined ? ((props: P) => Literate | Promise<SSRComponent>)
    : ((props: P) => [E, Literate])

export class SSRComponent<T extends AnyObject | null = null> implements TreeNode {
    // flask!: EffectFlask
    // setFlask(flask: EffectFlask) {
    //     this.flask = flask
    // }

    constructor(
        public parent: SSRComponent | null,
    ) {
    }
    // strings!: string[];
    // values!: any[];
    output!: Literate | Promise<SSRComponent>
    component!: T | null

    initialize(output: Literate | Promise<SSRComponent>, component: T | null) {
        this.output = output
        this.component = component
    }

    #tasks: {
        [LifecycleHook.ON_CREATED]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.ON_CREATED]: undefined,
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