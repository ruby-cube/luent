const handlerMap: WeakMap<Function, Function> = new WeakMap()

export function mapHandlers(wrapped: Function, unwrapped: Function) {
    handlerMap.set(wrapped, unwrapped)
}

export function unwrap(wrapped: Function) {
    const unwrapped = handlerMap.get(wrapped)
    if (!unwrapped) return wrapped;
    return unwrapped
}