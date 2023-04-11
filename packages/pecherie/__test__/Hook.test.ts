import { describe, test, expect, vi } from "vitest";
import { createHook } from "../Hook";
import { defineAutoCleanup } from "../../planify/scheduleAutoCleanup";
import { $lifetime, $tilStop, Callback } from "../../planify/planify";
import { $type } from "@rue/utils";



describe("one time handlers are run only once", () => {

    test("CASE: onceAsDefault: true", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })

        onTestCase(cb);

        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1)
    });


    test("CASE: onceAsDefault: true; multiple handlers", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true
        });
        const cbA = vi.fn(() => { })
        const cbB = vi.fn(() => { })

        onTestCase(cbA);
        onTestCase(cbB);

        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cbA).toHaveBeenCalledTimes(1)
        expect(cbB).toHaveBeenCalledTimes(1)
    });

    test("CASE: options {once: true}", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const cb = vi.fn(() => { })

        onTestCase(cb, { once: true });

        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1)
    });


    test("CASE: options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook1",
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers

        onTestCase(cb, { unlessCanceled: onEnd });

        castTestCase({ foo: "A" });
        expect(testCallbacks.size).toBe(0);

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);
    });


    test("CASE: onceAsDefault & options {once: true}", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers

        onTestCase(cb, { once: true });

        castTestCase({ foo: "A" });
        expect(testCallbacks.size).toBe(0);

        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);
    });


    test("CASE: onceAsDefault & options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook2",
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers

        onTestCase(cb, { unlessCanceled: onEnd });

        castTestCase({ foo: "A" });
        expect(testCallbacks.size).toBe(0);

        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);
    });

});




describe("one time handlers can be canceled", () => {


    test("CASE: options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook3",
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers
        //@ts-expect-error
        const endCallbacks = onEnd.handlers

        onTestCase(cb, { unlessCanceled: onEnd });
        castEnd()
        castTestCase({ foo: "A" })
        expect(cb).toHaveBeenCalledTimes(0);
        expect(testCallbacks.size).toBe(0);
        expect(endCallbacks.size).toBe(0); // ie. cancel function has been cleaned up

    });


    test("CASE: options {once: true}, pendingOp.cancel()", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });

        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers

        const pendingOp = onTestCase(cb, { once: true });

        pendingOp.cancel();
        castTestCase({ foo: "A" })
        expect(cb).toHaveBeenCalledTimes(0);
        expect(testCallbacks.size).toBe(0);
    });


    test("CASE: onceAsDefault, pendingOp.cancel()", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true,
        });

        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers

        const pendingOp = onTestCase(cb);

        pendingOp.cancel();
        castTestCase({ foo: "A" })
        expect(cb).toHaveBeenCalledTimes(0);
        expect(testCallbacks.size).toBe(0);
    });



});



describe("Canceler will be cleaned up if one time handler is run", () => {


    test("CASE: options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook4",
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const endCallbacks = onEnd.handlers

        onTestCase(cb, { unlessCanceled: onEnd });
        castEnd();
        castTestCase({ foo: "A" }); // handler called, endCallbacks.size === 0
        expect(endCallbacks.size).toBe(0); // ie. cancel function has been cleaned up

    });

    // test("CASE: options {unlessCanceled: ScheduleCancel}; remover function has been wrapped", () => {
    //     const [castTestCase, onTestCase] = createHook({
    //         hook: "test-hook",
    //         data: $type as {
    //             foo: "A"
    //         },
    //     });
    //     const [castEnd, onEnd] = createHook({
    //         hook: "end-hook4",
    //     });
    //     function onWrappedEnd(cb: Callback){
    //         return onEnd(()=>cb());
    //     }
    //     const cb = vi.fn(() => { })
    //     //@ts-expect-error
    //     const endCallbacks = onEnd.handlers

    //     onTestCase(cb, { unlessCanceled: onWrappedEnd });
    //     castEnd();
    //     castTestCase({ foo: "A" }); // handler called, endCallbacks.size === 0
    //     expect(endCallbacks.size).toBe(0); // ie. cancel function has been cleaned up

    // });


    test("CASE: onceAsDefault & options {unlessCanceled: ScheduleCancel}", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
            onceAsDefault: true
        });
        const [castEnd, onEnd] = createHook({
            hook: "end-hook5",
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const endCallbacks = onEnd.handlers

        onTestCase(cb, { unlessCanceled: onEnd });
        castEnd();
        castTestCase({ foo: "A" }); // handler called, endCallbacks.size === 0
        expect(endCallbacks.size).toBe(0); // ie. cancel function has been cleaned up

    });

});



describe("sustained listeners run until stopped", () => {


    test("CASE: `until` option", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
        })
        const [castEnd, onEnd] = createHook({
            hook: "end-hook6",
        });
        const cb = vi.fn(() => { })
        onTestCase(cb, { until: onEnd });
        //@ts-expect-error
        const endCallbacks = onEnd.handlers
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers

        castTestCase();
        castTestCase();
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);

        castEnd();
        expect(endCallbacks.size).toBe(0);
        expect(testCallbacks.size).toBe(0);

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);
    });


    test("CASE: listener.stop()", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
        })
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers;

        const listener = onTestCase(cb, { $tilStop });

        castTestCase();
        castTestCase();
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);

        listener.stop();
        expect(testCallbacks.size).toBe(0);

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);
    });


    test("CASE: auto cleanup, multiple handlers", () => new Promise((done) => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
            // onceAsDefault: true,
        });
        let settingUp = false;
        defineAutoCleanup((cleanup) => {
            if (settingUp) {
                return onTestUnmounted(cleanup);
            }
        })
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
        })

        const cb = vi.fn(() => { })
        const cbB = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers
        //@ts-expect-error
        const unmountedCallbacks = onTestUnmounted.handlers

        settingUp = true;
        onTestCase(cb);
        onTestCase(cbB);
        settingUp = false;
        expect(unmountedCallbacks.size).toBe(2);

        castTestCase();
        castTestCase();
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);
        expect(cbB).toHaveBeenCalledTimes(3);

        castTestUnmounted();
        expect(testCallbacks.size).toBe(0);

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);
        expect(cbB).toHaveBeenCalledTimes(3);
        done("test done")
    }));


    test("CASE: auto cleanup", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
            // onceAsDefault: true,
        });
        let settingUp = false;
        defineAutoCleanup((cleanup) => {
            if (settingUp) {
                return onTestUnmounted(cleanup);
            }
        })
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
        })

        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers

        settingUp = true;
        onTestCase(cb);
        settingUp = false;

        castTestCase();
        castTestCase();
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);

        castTestUnmounted();
        expect(testCallbacks.size).toBe(0);

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);
    });

});


describe("options should override default", () => {

    test("CASE: onceAsDefault and sustain", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })

        onTestCase(cb, { sustain: true });

        castTestCase();
        castTestCase();
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);
    });

    test("CASE: onceAsDefault and until", () => {
        const [castEnd, onEnd] = createHook({
            hook: "end-hook6",
        });
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers

        onTestCase(cb, { until: onEnd });

        castTestCase();
        castTestCase();
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);

        castEnd();
        expect(testCallbacks.size).toBe(0);
    });


    test("CASE: onceAsDefault and $lifetime", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })

        onTestCase(cb, { $lifetime });

        castTestCase();
        castTestCase();
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);
    });

    test("CASE: onceAsDefault and $tilStop", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            onceAsDefault: true
        });
        const cb = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacks = onTestCase.handlers

        const listener = onTestCase(cb, { $tilStop });

        castTestCase();
        castTestCase();
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);

        listener.stop();
        expect(testCallbacks.size).toBe(0);

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3);
    });







})
