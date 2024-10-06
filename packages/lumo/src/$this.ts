import { TypedKey } from "./component/provide";
import { InternalComponent } from "./component/InternalComponent";
import { DynamicNode } from "./dynamic/DynamicNode";

let activeScope: ThisScope | undefined
let prevScope: ThisScope | undefined

export function pushActiveScope(scope: ThisScope) {
    prevScope = activeScope
    activeScope = scope
}

export function popActiveScope() {
    activeScope = prevScope;
    prevScope = undefined;
}

export function $this() {
    return activeScope
}



class ThisScope {

    constructor(
        private dynamicNode: DynamicNode,
        private provider: InternalComponent,
        private effect?: EffectScope
    ) { }
    get onCreated() { // no reason to be called after await
        return this.dynamicNode.onCreated // bound to dynamic node
    }
    get onDestroy() {
        return this.dynamicNode.onDestroy // can be called after await
    }

    defineCleanup(cleanUp: () => void) { // Must not be called after await
        if (this.effect) this.effect.setCleanup(cleanUp);
        this.dynamicNode.setCleanup(cleanUp);
    }

    fromContext<T>(key: string | TypedKey<T>): T {
        return this.provider.fromContext(key)
    }

    fromGlobal<T>(key: string | TypedKey<T>): T {
        return this.provider.fromGlobal(key)
    }

    fromApp<T>(key: string | TypedKey<T>): T {
        return this.provider.fromApp(key)
    }
}