import { EqualTypes, typeTest } from "../../dev/type-test"
import { createHook } from "../Hook"
import { PendingOp } from "../../flask/PendingOp"
import { createTargetedHook } from "../TargetedHook"
import { $lifetime, $tilStop, ActiveListener } from "../../flask/flaskedListeners"


{/* CASE: Sustained listener. No listener options */

    const [castTestCase, onTestCase] = createHook({
    })

    const listener = onTestCase((ctx) => {
        return "hi"
    })
    typeTest<EqualTypes<typeof listener, ActiveListener>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}



{/* CASE: Sustained listener. Listener options... once */

    const [castTestCase, onTestCase] = createHook({
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
    }, { once: true })
    typeTest<EqualTypes<typeof pendingOp, PendingOp<string>>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}



{/* CASE: Sustained listener. Listener options... sustain */

    const [castTestCase, onTestCase] = createHook({
    })

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { sustain: true })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}





{/* CASE: Sustained listener. Listener options... unless canceled (arrow function) */

    const [castTestUnmounted, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
    }, { cancel: (cancel) => onTestUnmounted(cancel) })
}




{/* CASE: Sustained listener. Listener options... unless canceled (non-targeted hook) */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
    }, { cancel: onTestUnmounted })
    typeTest<EqualTypes<typeof pendingOp, PendingOp<string>>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}

{/* CASE: Sustained listener. Listener options... unless canceled (targeted hook) */

    const [_, onTestUnmounted] = createTargetedHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
        //@ts-expect-error: targeted hook needs to be wrapped in an arrow function
    }, { cancel: onTestUnmounted })

}



{/* CASE: Sustained listener. Listener options... unless canceled (malformed: no return) */

    const [castTestUnmounted, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
        //@ts-expect-error: schedule cancel cb does not return a pending op
    }, { cancel: (cancel) => { onTestUnmounted(cancel) } })
}



{/* CASE: Sustained listener. Listener options... unless canceled (malformed: no args) */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
        //@ts-expect-error: no args
    }, { cancel: () => onTestUnmounted() })
}




{/* CASE: Sustained listener. Listener options... until */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
    })

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { until: onTestUnmounted })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}


{/* CASE: Sustained listener. Listener options... until (no return) */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
    })

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { until: (stop) => { onTestUnmounted(stop) } })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}


{/* CASE: Sustained listener. Listener options... until (malformed: no args) */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
    })

    //@ts-expect-error: CallbackRemover must be passed to Listener
    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { until: () => onTestUnmounted })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}


{/* CASE: Sustained listener. Listener options... $lifetime */

    const [castTestCase, onTestCase] = createHook()

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { $lifetime })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);
}

{/* CASE: Sustained listener. Listener options... $tilStop */

    const [castTestCase, onTestCase] = createHook()

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { $tilStop })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);
}