import { describe, test, expect, vi } from "vitest";
import { createHook } from "../Hook";
import { $type } from "@rue/utils";

describe("return types of createHook's caster and listener", () => {

    test("CASE: OneTimeListener", () => new Promise(async (done) => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true,
        })

        const pendingOp = onTestCase((ctx) => { return { frog: "woo-oo" } });
        expect(pendingOp instanceof Promise).toBe(true);

        setTimeout(() => castTestCase({
            foo: "A"
        }), 1)

        const result = await pendingOp;
        expect(result).toEqual({ frog: "woo-oo" });
        done("test done");
    }));


    test("CASE: useHookState", () => {
        const [_, onEnd] = createHook({
            hook: "end-hook",
        });
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: string
            },
            reply: () => {
                const state = {
                    defaultPrevented: false
                }
                return {
                    state,
                    methods: {
                        preventDefault() {
                            state.defaultPrevented = true;
                        }
                    }
                }
            }
        })

        onTestCase((ctx) => { ctx.preventDefault() }, {until: onEnd});
        const state = castTestCase({ foo: "A" })

        expect(state.defaultPrevented).toEqual(true);
    });


    test("CASE: no hook state", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: string
            },
            onceAsDefault: true,
        })

        onTestCase((ctx) => { });
        const val = castTestCase({ foo: "A" })

        expect(val).toEqual(undefined);
    });

});



describe("arg of handler", () => {

    test("CASE: data object", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true,
        })

        onTestCase((ctx) => {
            expect(ctx).toEqual({ hook: "test-hook", foo: "A" })
        });

        castTestCase({ foo: "A" });
    });


    test("CASE: non-object data", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as string,
            onceAsDefault: true
        })

        onTestCase((ctx) => {
            expect(ctx).toEqual({ hook: "test-hook", data: "kermit" })
        });

        castTestCase("kermit");
    });


    test("CASE: non-object data, dataAsArg", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as string,
            dataAsArg: true,
            onceAsDefault: true,
        })

        onTestCase((ctx) => {
            expect(ctx).toEqual("kermit")
        });

        castTestCase("kermit");
    });


    test("CASE: object data, dataAsArg", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {foo: "kermit"},
            dataAsArg: true,
            onceAsDefault: true,
        })

        onTestCase((ctx) => {
            expect(ctx).toEqual({foo: "kermit"})
        });

        castTestCase({foo: "kermit"});
    });


    test("CASE: object data, no hook name", () => {
        const [castTestCase, onTestCase] = createHook({
            data: $type as {foo: string},
            onceAsDefault: true,
        })

        onTestCase((ctx) => {
            expect(ctx).toEqual({ hook: "[unnamed hook]", foo: "A" })
        });

        castTestCase({ foo: "A" });
    });


    test("CASE: object data, no hook name", () => {
        const [castTestCase, onTestCase] = createHook({
            data: $type as string,
            onceAsDefault: true,
        })

        onTestCase((ctx) => {
            expect(ctx).toEqual({ hook: "[unnamed hook]", data: "A" })
        });

        castTestCase("A");
    });

});