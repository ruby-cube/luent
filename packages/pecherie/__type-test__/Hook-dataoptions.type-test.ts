import { expectTypeOf } from "vitest"
import { EqualTypes, typeTest } from "../../dev/type-test"
import { ActiveListener } from "../../flask/flaskableListeners"
import { createHook } from "../Hook"
import { $type } from "@rue/utils"



{/* CASE: No Config */
    const [castTestCase, onTestCase] = createHook()

    const pendingOp = onTestCase((ctx) => {
        typeTest<EqualTypes<typeof ctx, { hook: "[unnamed hook]" }>>(true);
    })
    typeTest<EqualTypes<typeof pendingOp, ActiveListener>>(true);

    const returnVal = castTestCase();
    typeTest<EqualTypes<typeof returnVal, void>>(true);
}




{/* CASE: Config with hook name */

    const [castTestCase, onTestCase] = createHook({
        hook: "test-hook",
    })

    const pendingOp = onTestCase((ctx) => {
        typeTest<EqualTypes<typeof ctx, { hook: "test-hook" }>>(true);
    })
    typeTest<EqualTypes<typeof pendingOp, ActiveListener>>(true);

    const returnVal = castTestCase()
    typeTest<EqualTypes<typeof returnVal, void>>(true);
}




{/* CASE: Config with... hook name, data as object */

    const [castTestCase, onTestCase] = createHook({
        hook: "test-hook",
        data: $type as {
            foo: "A"
        },
    })

    const pendingOp = onTestCase((ctx) => {
        typeTest<EqualTypes<typeof ctx, { hook: "test-hook", foo: "A" }>>(true);
    })
    typeTest<EqualTypes<typeof pendingOp, ActiveListener>>(true);

    const returnVal = castTestCase({ foo: "A" })
    typeTest<EqualTypes<typeof returnVal, void>>(true);
}



{/* CASE: Config with... no name, data as object */

    const [castTestCase, onTestCase] = createHook({
        data: $type as {
            foo: "A"
        },
    })

    const pendingOp = onTestCase((ctx) => {
        typeTest<EqualTypes<typeof ctx, { hook: "[unnamed hook]", foo: "A" }>>(true);
    })
    typeTest<EqualTypes<typeof pendingOp, ActiveListener>>(true);

    const returnVal = castTestCase({ foo: "A" })
    typeTest<EqualTypes<typeof returnVal, void>>(true);
}




{/* CASE: Config with... no name, data as non-object */

    const [castTestCase, onTestCase] = createHook({
        data: $type as string,
    })

    const pendingOp = onTestCase((ctx) => {
        typeTest<EqualTypes<typeof ctx, { hook: "[unnamed hook]", data: string }>>(true);
    })
    typeTest<EqualTypes<typeof pendingOp, ActiveListener>>(true);

    const returnVal = castTestCase("A")
    typeTest<EqualTypes<typeof returnVal, void>>(true);
}





{/* CASE: Config with... hook name, data as object, dataAsArg */

    const [castTestCase, onTestCase] = createHook({
        hook: "test-hook",
        data: $type as {
            foo: "A"
        },
        dataAsArg: true,
    })

    const pendingOp = onTestCase((ctx) => {
        typeTest<EqualTypes<typeof ctx, { foo: "A" }>>(true);
    })
    typeTest<EqualTypes<typeof pendingOp, ActiveListener>>(true);

    const returnVal = castTestCase({ foo: "A" })
    typeTest<EqualTypes<typeof returnVal, void>>(true);

}





{/* CASE: Config with... hook name, data as non-object, dataAsArg */

    const [castTestCase, onTestCase] = createHook({
        hook: "test-hook",
        data: $type as string,
        dataAsArg: true,
    })

    const pendingOp = onTestCase((ctx) => {
        typeTest<EqualTypes<typeof ctx, string>>(true);
    })
    typeTest<EqualTypes<typeof pendingOp, ActiveListener>>(true);

    const returnVal = castTestCase("A")
    typeTest<EqualTypes<typeof returnVal, void>>(true);
}





{/* CASE: Config with... dataAsArg & reply */

    const [castTestCase, onTestCase] = createHook({
        data: { foo: "" },
        //@ts-expect-error: reply and dataAsArg cannot both be true
        dataAsArg: true,
        reply: () => ({
            state: {},
            methods: {
                setFrog() {

                }
            }
        })
    })

}


{/* CASE: Config with... dataAsArg & no data */

    const [castTestCase, onTestCase] = createHook({
        //@ts-expect-error: missing data config
        dataAsArg: true,
    })

}




{/* CASE: Config with... hook name, data as object, reply */

    const [castTestCase, onTestCase] = createHook({
        hook: "test-hook",
        data: $type as {
            foo: "A"
        },
        reply: () => ({
            state: { isFrog: true },
            methods: { toggleFrog(frog: boolean) { return "kermit!" } }
        })
    })

    const pendingOp = onTestCase((ctx) => {
        typeTest<EqualTypes<typeof ctx, { hook: "test-hook", foo: "A", toggleFrog: (frog: boolean) => string }>>(true);
    })
    typeTest<EqualTypes<typeof pendingOp, ActiveListener>>(true);

    const returnVal = castTestCase({ foo: "A" })
    typeTest<EqualTypes<typeof returnVal, { isFrog: boolean }>>(true);

}




{/* CASE: Config with... no name, data as object, reply */

    const [castTestCase, onTestCase] = createHook({
        data: $type as {
            foo: "A"
        },
        reply: () => ({
            state: { isFrog: true },
            methods: { toggleFrog(frog: boolean) { return "kermit!" } }
        })
    })

    const pendingOp = onTestCase((ctx) => {
        typeTest<EqualTypes<typeof ctx, { hook: "[unnamed hook]", foo: "A", toggleFrog: (frog: boolean) => string }>>(true);
    })
    typeTest<EqualTypes<typeof pendingOp, ActiveListener>>(true);

    const returnVal = castTestCase({ foo: "A" })
    typeTest<EqualTypes<typeof returnVal, { isFrog: boolean }>>(true);

}





{/* CASE: Config with... hook name, data as object, reply with no methods */

    const [castTestCase, onTestCase] = createHook({
        //@ts-expect-error: must return methods
        reply: () => ({
            state: { isFrog: true },
        })
    })

}




{/* CASE: Config with... hook name, data as object, reply with no state */

    const [castTestCase, onTestCase] = createHook({
        //@ts-expect-error: must return state
        reply: () => ({
            methods: { toggleFrog() { } }
        })
    })

}

