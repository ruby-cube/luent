import { $type } from "@rue/utils";
import { EqualTypes, typeTest } from "../../dev/type-test";
import { Callback, OneTimeTargetedListener } from "../../flask/flaskableListeners";
import { createHook } from "../Hook"
import { createTargetedHook } from "../TargetedHook"
import { AnyObject } from "@rue/types";

{/* CASE: no targetIdType */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createTargetedHook({
        data: $type as {
            foo: string
        },
        onceAsDefault: true,
    })
    const targ = {};
    typeTest<EqualTypes<typeof onTestCase, OneTimeTargetedListener<AnyObject, Callback>>>(true);
    onTestCase(targ, (ctx) => {
        return "hi"
    })

    const returnVal = castTestCase(targ, { foo: "kermit" })
    typeTest<EqualTypes<typeof returnVal, void>>(true);
}

{/* CASE: targetIdType */

    const [_, onTestUnmounted] = createHook({ hook: "test-unmounted" })

    const [castTestCase, onTestCase] = createTargetedHook({
        data: $type as {
            foo: string
        },
        onceAsDefault: true,
        targetID: $type as string
    })
    const targ = "aaa";
    typeTest<EqualTypes<typeof onTestCase, OneTimeTargetedListener<string, Callback>>>(true);
    onTestCase(targ, (ctx) => { })

    const returnVal = castTestCase(targ, { foo: "kermit" })
    typeTest<EqualTypes<typeof returnVal, void>>(true);
}