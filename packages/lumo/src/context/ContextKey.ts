export function createContextKey<T>(typeDef: { defaultValue: T }) {


    return {
        getDefault: typeDef.defaultValue as () => T
    }
}

export function createInjectedClass(classKey: ContextKey, get = fromApp) {
    return (...args: any[]) => new get(classKey)(...args)
}

export function createInjectedFactory(classKey: ContextKey, get = fromApp) {
    return (...args: any[]) => get(classKey)(...args)
}