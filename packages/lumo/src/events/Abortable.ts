function Abortable() {
    const controller = new AbortController()
    return {
        abort() {
            controller.abort()
        },
        abortSignal: controller.signal
    }
}