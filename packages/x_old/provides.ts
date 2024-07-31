import { AnyObject, OptionalKeys, RequiredKeys } from "@rue/types";
import { getCurrentComponent, InternalComponent } from "../lumo/src/component/component";

export function getContext<T extends AnyObject>(keys: RequiredKeys<T>[], optional?: OptionalKeys<T>[]): T {
    const component = getCurrentComponent()
    if (!component || component === 'root') throw new Error("getContext must be called from component setup");
    //@ts-expect-error
    const context: T = {};
    let parent = component.parent;
    if (parent === 'root') throw new Error("Component is the root component and does not have a parent to provide context");
    let provides = parent.provides;
    while (!provides) {
        parent = parent.parent;
        if (parent === 'root') throw new Error("No parent provides context for this component")
        provides = parent.provides;
    }
    for (const key of keys) {
        let _parent: InternalComponent | 'root' = parent;
        while (!provides || !(key in provides)) {
            _parent = _parent.parent;
            if (_parent === 'root') throw new Error("No component provides this resource");
            provides = _parent.provides;
        }
        //@ts-expect-error
        context[key] = provides[key];
    }
    if (optional) {
        for (const key of optional) {
            let _parent: InternalComponent | 'root' = parent;
            while (!provides || !(key in provides)) {
                _parent = _parent.parent;
                if (_parent === 'root') break;
                provides = _parent.provides;
            }
            //@ts-expect-error
            if (provides) context[key] = provides[key];
        }
    }
    return context;
}



function fromContext(key: symbol | string, source?: 'root' | 'app') {
    if (source === 'root') return root.provides[key]
}
