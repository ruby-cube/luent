import { expectTypeOf } from "vitest"
import { EqualTypes, typeTest } from "../../dev/type-test"
import { createHook } from "../Hook"
import { PendingOp } from "../../flask/PendingOp"
import { createTargetedHook } from "../TargetedHook"
import { $lifetime, $tilStop, ActiveListener } from "../../flask/flaskedListeners"
import { $type } from "@rue/utils"


{/* CASE: Config with... once as default. No listener options */

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
    })
    typeTest<EqualTypes<typeof pendingOp, PendingOp<string>>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}



{/* CASE: Config with... once as default. Listener options... once */

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
    }, { once: true })
    typeTest<EqualTypes<typeof pendingOp, PendingOp<string>>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}



{/* CASE: Config with... once as default. Listener options... sustain */

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { sustain: true })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}





{/* CASE: Config with... once as default. Listener options... unless canceled (arrow function) */

    const [castTestUnmounted, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
    }, { cancel: (cancel) => onTestUnmounted(cancel) })  //FIX: this should not produce an error ...
}




{/* CASE: Config with... once as default. Listener options... unless canceled (non-targeted hook) */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
    }, { cancel: onTestUnmounted }) //FIX: this should not produce an error ...
    typeTest<EqualTypes<typeof pendingOp, PendingOp<string>>>(true);

    pendingOp.cancel()

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}

{/* CASE: Config with... once as default. Listener options... unless canceled (targeted hook) */

    const [_, onTestUnmounted] = createTargetedHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
        //@ts-expect-error: targeted hook needs to be wrapped in an arrow function
    }, { cancel: onTestUnmounted })

}



{/* CASE: Config with... once as default. Listener options... unless canceled (malformed: no return) */

    const [castTestUnmounted, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
        //@ts-expect-error: schedule cancel cb does not return a pending op
    }, { cancel: (cancel) => { onTestUnmounted(cancel) } })
}


type PendingCancelOp = { cancel: () => void; };
type CallbackRemover = {
    (): void;
    isRemover: true;
}


{/* CASE: CallbackRemover as callback. Expect return to be PendingCancelOp */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const pendingCancelOp = onTestUnmounted($type as CallbackRemover)
    typeTest<EqualTypes<typeof pendingCancelOp, PendingCancelOp>>(true)
}



{/* CASE: Config with... once as default. Listener options... unless canceled (malformed: no args) */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const pendingOp = onTestCase((ctx) => {
        return "hi"
    }, {
        //@ts-expect-error: no args
        cancel: () => onTestUnmounted
    })
}






{/* CASE: Config with... once as default. Listener options... until */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { until: onTestUnmounted })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}


{/* CASE: Config with... once as default. Listener options... until (no return) */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { until: (stop) => { onTestUnmounted(stop) } })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}


{/* CASE: Config with... once as default. Listener options... until (malformed: no args) */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    //@ts-expect-error: CallbackRemover must be passed to Listener
    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { until: () => onTestUnmounted })
}

{/* CASE: Config with... once as default. Listener options... $lifetime */

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { $lifetime })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);
}

{/* CASE: Config with... once as default. Listener options... $tilStop */

    const [castTestCase, onTestCase] = createHook({
        onceAsDefault: true,
    })

    const testCaseListener = onTestCase((ctx) => {
        return "hi"
    }, { $tilStop })
    typeTest<EqualTypes<typeof testCaseListener, ActiveListener>>(true);
}





// type Options<OPT> = {
//     until?: OPT extends {until: infer H} ? H extends (stop: infer P) => void ? P extends CallbackRemover ? (stop: CallbackRemover) => void : "Error: Listener is missing CallbackRemover parameter" : never : never;
// }

// function onHook<OPT extends Options<OPT>>(opt?: OPT) {

// }

// onHook({ until: () => {return ""} })