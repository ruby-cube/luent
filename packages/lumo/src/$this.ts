import { TypedKey } from "./component/provide";
import { InternalComponent } from "./component/InternalComponent";
import { DynamicNode } from "./dynamic/DynamicNode";
import { getActiveComponent } from "./component/makeComponent";
import { SchedulerOptions } from "@rue/flask";

export function $thisComponent(){
    const component = getActiveComponent();
    if (!component) throw new Error('$thisComponent cannot be called outside of component setup')
    if (component.instance) return component.instance;
    return component.createInstance()
}

export function $thisEffect(){

}

export type ThisComponent = {
    onCreated: (cb: () => void, options?: SchedulerOptions) => void
    onDestroy: (cb: () => void, options?: SchedulerOptions) => void

    getFromContext?: <T, OPT extends "?" | undefined = undefined>(key: TypedKey<T>, optional?: "?")=> OPT extends "?" ? T | undefined : T
    getFromGlobal?: <T, OPT extends "?" | undefined = undefined>(key: TypedKey<T>, optional?: "?")=> OPT extends "?" ? T | undefined : T
    getFromApp?: <T, OPT extends "?" | undefined = undefined>(key: TypedKey<T>, optional?: "?")=> OPT extends "?" ? T | undefined : T
}

// class ThisScope {

//     constructor(
//         private dynamicNode: DynamicNode,
//         private provider: InternalComponent,
//         private effect?: EffectScope
//     ) { }
//     get onCreated() { // no reason to be called after await
//         return this.dynamicNode.onCreated // bound to dynamic node
//     }
//     get onDestroy() {
//         return this.dynamicNode.onDestroy // can be called after await
//     }

//     defineCleanup(cleanUp: () => void) { // Must not be called after await
//         if (this.effect) this.effect.setCleanup(cleanUp);
//         this.dynamicNode.setCleanup(cleanUp);
//     }

//     fromContext<T>(key: string | TypedKey<T>): T {
//         return this.provider.fromContext(key)
//     }

//     fromGlobal<T>(key: string | TypedKey<T>): T {
//         return this.provider.fromGlobal(key)
//     }

//     fromApp<T>(key: string | TypedKey<T>): T {
//         return this.provider.fromApp(key)
//     }
// }