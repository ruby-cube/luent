import { inject, InjectionKey, onBeforeUnmount } from "vue";


export const acquire = inject; // renamed to better fit the analogy

type DisclosureMap = Map<InjectionKey<unknown>, any>;

const targetMap: Map<any, DisclosureMap> = new Map();

export function discloseCommons<T>(targetID: T, key: InjectionKey<unknown>) {
    const existingMap = targetMap.get(targetID);
    const disclosureMap = existingMap || new Map();
    if (!existingMap) targetMap.set(targetID, disclosureMap);
    disclosureMap.set(key, acquire(key));
    onBeforeUnmount(() => {
        targetMap.delete(targetID);
    })
}



export function accessCommons<T, V>(targetID: T, key: InjectionKey<V>): V {
    const disclosureMap = targetMap.get(targetID);
    if (disclosureMap == null) console.error("No acquirements found for this targetID. Make sure Vue component has called `discloseAcquirement` or check if targetID is correct");
    const value = disclosureMap!.get(key);
    if (value == null) console.error("No value found for this key. Make sure value has been disclosed by Vue component or value has been provided by a component predecessor")
    return value;
}

// USAGE:
if (__DOCU__){
    // shared interface between A & B & ancestor
    type FrogID = "Frog"
    const DISPATCH_SOMETHING = Symbol() as InjectionKey<"frog">;
    


    // A
    discloseCommons<FrogID>("Frog", DISPATCH_SOMETHING)
    
    // B
    const da = accessCommons("Frog" satisfies FrogID, DISPATCH_SOMETHING)
}