import { getCurrentComponent, InternalComponent } from "./component";
import { onBeforeMount } from "./lifecycle";

class Provider {
    entries: Map<Symbol | string, any> = new Map();

    constructor(
        public component: InternalComponent | "root" | null,
        public parent: Provider | null
    ) { }
}

// manage provider stack
let currentProvider: Provider | null = null;
let previousProvider: Provider | null = null;

function pushProvider(provider: Provider) {
    previousProvider = currentProvider;
    currentProvider = provider;
}

function popProvider() {
    currentProvider = previousProvider;
}

//TODO: [ ] typescript generics 


// Public API
export function provide<T>(key: SymbolKey<T> | symbol | string, value: T) {
    const component = getCurrentComponent();
    if (component === "root") provideGlobal(key, value);
    let provider = currentProvider;
    if (!provider || provider.component !== component) {
        provider = new Provider(component, provider);
        pushProvider(provider);
        onBeforeMount(() => {
            popProvider()
        })
    }
    provider.entries.set(key, value);
}


export function pull<T>(key: SymbolKey<T> | symbol | string, optional?: '?'): T | undefined {
    const component = getCurrentComponent();
    let provider = currentProvider;
    if (!provider && !optional) throw new Error("There is no provider in this component's ancestry. `fromContext` can only be called from within a component's setup")
    if (!provider) return undefined;
    // climb provider tree
    let parent = provider.component === component ? provider.parent : provider;
    while (parent !== null) {
        const entries = parent.entries
        if (entries.has(key)) return entries.get(key);
        parent = parent.parent;
    }
    try {
        return pullGlobal(key);
    }
    catch(e){
        if (optional) return undefined;
        throw new Error("There is no provider that contains the requested key")
    }
}



const globalEntries: Map<symbol | string, any> = new Map();

export function provideGlobal<T>(key: SymbolKey<T> | symbol | string, value: T) {
    globalEntries.set(key, value);
}

export function pullGlobal<T>(key: SymbolKey<T> | symbol | string, optional?: '?'): T | undefined {
    if (!optional && !globalEntries.has(key)) throw new Error("This value has not been provided globally")
    return globalEntries.get(key)
}


// Symbol Key
export type SymbolKey<T> = T & symbol;


// Usage
// const SELECTION = Symbol() as SymbolKey<{ position: number }> // define keys in a keys file
// provide(SELECTION, { position: 9 }) // in component
// const selection = pull(SELECTION); // in component