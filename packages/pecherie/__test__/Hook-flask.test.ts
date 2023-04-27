//-@ts-nocheck
import { vi, expect, describe, test, beforeEach } from "vitest";
import { sceneSetup, Scene } from "../../flask/Scene";
import { createHook, DevListener } from "../Hook";
import { $type } from "@rue/utils";
import { Callback, Callbacks, initFlask } from "../../flask";
import { Flask, flaskSetup } from "../../flask/flask";

// [ ] autocleanup with root flask
// [ ] autocleanup with no root flask
// [ ] cleanup cleanups if alternative cleanup strategy run
// [ ] outlive root flask

describe("autocleanup via flask", () => {

    test.only("CASE: auto cleanup, multiple handlers, with root flask. Root flask unmounts", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
            // onceAsDefault: true,
        });
        let settingUp = false;
        initFlask({
            rootFlasks: [{
                setupChecker: () => settingUp,
                autoCleanupScheduler: onTestUnmounted
            }]
        })
        const [castTestCaseA, onTestCaseA] = createHook({
            hook: "test-hook-A",
        })

        const [castTestCaseB, onTestCaseB] = createHook({
            hook: "test-hook-B",
        })

        const [castTestCaseC, onTestCaseC] = createHook({
            hook: "test-hook-B",
        })

        const cb = vi.fn(() => { })
        const cbB = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacksA = onTestCaseA.handlers
        //@ts-expect-error
        const testCallbacksB = onTestCaseB.handlers
        //@ts-expect-error
        const unmountedCallbacks = onTestUnmounted.handlers

        settingUp = true;
        const flask = flaskSetup((flask) => {
            onTestCaseA(cb, {until: onTestCaseC});
            onTestCaseB(cbB, {until: onTestCaseC});
            onTestCaseC(()=>flask.dispose());
            return flask;
        })
        settingUp = false;
        expect(unmountedCallbacks.size).toBe(5);

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        castTestUnmounted();
        expect(testCallbacksA.size).toBe(0);
        expect(testCallbacksB.size).toBe(0);
        expect(unmountedCallbacks.size).toBe(0);

        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(0);

        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);
        // done("test done")
    });


    test.only("CASE: auto cleanup, multiple handlers, with root flask. Flask is disposed", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
            // onceAsDefault: true,
        });
        let settingUp = false;
        initFlask({
            rootFlasks: [{
                setupChecker: () => settingUp,
                autoCleanupScheduler: onTestUnmounted
            }]
        })
        const [castTestCaseA, onTestCaseA] = createHook({
            hook: "test-hook-A",
        })

        const [castTestCaseB, onTestCaseB] = createHook({
            hook: "test-hook-B",
        })

        const [castTestCaseC, onTestCaseC] = createHook({
            hook: "test-hook-B",
        })

        const cb = vi.fn(() => { })
        const cbB = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacksA = onTestCaseA.handlers
        //@ts-expect-error
        const testCallbacksB = onTestCaseB.handlers
        //@ts-expect-error
        const testCallbacksC = onTestCaseC.handlers
        //@ts-expect-error
        const unmountedCallbacks = onTestUnmounted.handlers

        settingUp = true;
        const flask = flaskSetup((flask: Flask) => {
            onTestCaseA(cb, {until: onTestUnmounted});
            onTestCaseB(cbB, {until: onTestUnmounted});
            onTestCaseC(() => flask.dispose());
            return flask;
        })
        settingUp = false;
        expect(unmountedCallbacks.size).toBe(7);

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        castTestCaseC();
        expect(testCallbacksA.size).toBe(0);
        expect(testCallbacksB.size).toBe(0);
        expect(testCallbacksC.size).toBe(0);

        //@ts-expect-error
        expect(flask!.disposalHandlers.size).toBe(0);

        expect(unmountedCallbacks.size).toBe(0);

        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);
        // done("test done")
    });


})

describe("in flask, cleanup functions are cleaned up if a different cleanup strategy executes", () => {

    test.only("CASE: register until and auto cleanup and nested flask. Execute auto cleanup. Expect until's callback to be gone", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
        });
        let settingUp = false;

        initFlask({
            rootFlasks: [{
                setupChecker: () => settingUp,
                autoCleanupScheduler: onTestUnmounted
            }]
        })

        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castSomethingEnded, onSomethingEnded] = createHook({
            hook: "test-hook",
        });

        const cb = vi.fn(() => { })

        settingUp = true;
        const flask = flaskSetup((flask: Flask) => {
            onTestCase(cb, { until: onSomethingEnded }) // modo auto cleanup
            return flask;
        })
        settingUp = false;


        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1)

        castTestUnmounted();
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1);

        const handlers = (<DevListener<typeof onSomethingEnded>>onSomethingEnded).handlers
        expect(handlers.size).toBe(0);

        //@ts-expect-error
        expect(flask!.disposalHandlers.size).toBe(0);

        const autoCleanupCallbacks = (<DevListener<typeof onTestUnmounted>>onTestUnmounted).handlers
        expect(autoCleanupCallbacks.size).toBe(0);
    })

    test("CASE: register until and auto cleanup. Execute until. Expect autocleanup's callback to be gone", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
        });
        let settingUp = false;
        // defineAutoCleanup((cleanup) => { //Beware: this sets a global variable that will affect subsequent tests
        //     if (settingUp) {
        //         return onTestUnmounted(cleanup);
        //     }
        // })
        initFlask({
            rootFlasks: [{
                setupChecker: () => settingUp,
                autoCleanupScheduler: onTestUnmounted
            }]
        })

        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castSomethingEnded, onSomethingEnded] = createHook({
            hook: "test-hook",
        });

        const cb = vi.fn(() => { })
        const handlers = (<DevListener<typeof onSomethingEnded>>onSomethingEnded).handlers
        const autoCleanupCallbacks = (<DevListener<typeof onTestUnmounted>>onTestUnmounted).handlers

        settingUp = true;
        onTestCase(cb, { until: onSomethingEnded }) // modo auto cleanup
        settingUp = false;
        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1)

        castSomethingEnded();
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1);

        expect(handlers.size).toBe(0);
        expect(autoCleanupCallbacks.size).toBe(0);

    })


    test("CASE: register until and scene. Execute scene cleanup. Expect both scene and until's callback to be gone", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castSomethingEnded, onSomethingEnded] = createHook({
            hook: "something-ended",
        });
        const [castMouseUp, onMouseUp] = createHook({
            hook: "mouse-up",
        });

        const cb = vi.fn(() => { })
        let sceneCallbacks: Callbacks;
        sceneSetup((scene) => {
            sceneCallbacks =
                //@ts-expect-error
                scene.endHandlers;
            onTestCase(cb, { until: onSomethingEnded }) // modo auto cleanup

            onMouseUp(() => {
                scene.end()
            })
        })

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1)

        castMouseUp();
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1);

        const handlers = (<DevListener<typeof onSomethingEnded>>onSomethingEnded).handlers
        expect(handlers.size).toBe(0);
        //@ts-ignore
        expect(sceneCallbacks.size).toBe(0);
    })


    test("CASE: register `until` and `scene`. Execute `until`. Expect `scene`'s callback to be gone", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const [castSomethingEnded, onSomethingEnded] = createHook({
            hook: "something ended",
        });
        const [castMouseUp, onMouseUp] = createHook({
            hook: "mouse-up",
        });

        const cb = vi.fn(() => { })
        let sceneCallbacks: Callbacks;
        sceneSetup((scene) => {
            sceneCallbacks =
                //@ts-expect-error
                scene.endHandlers;
            onTestCase(cb, { until: onSomethingEnded }) // modo auto cleanup

            onMouseUp(() => {
                scene.end()
            }, { once: true })

        })

        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1)

        castSomethingEnded();
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1);

        //@ts-ignore
        expect(sceneCallbacks.size).toBe(1);

        castMouseUp()
        //@ts-ignore
        expect(sceneCallbacks.size).toBe(0);
    })


    test("CASE: register `scene` and auto cleanup. Execute auto cleanup. Expect `Scene` to be clean", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
        });
        let settingUp = false;
        // defineAutoCleanup((cleanup) => {
        //     if (settingUp) {
        //         return onTestUnmounted(cleanup);
        //     }
        // })
        initFlask({
            rootFlasks: [{
                setupChecker: () => settingUp,
                autoCleanupScheduler: onTestUnmounted
            }]
        })
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });

        const cb = vi.fn(() => { })

        settingUp = true;
        let sceneCallbacks: Callbacks;
        sceneSetup((scene) => {
            sceneCallbacks =
                //@ts-expect-error
                scene.endHandlers;
            onTestCase(cb) // modo auto cleanup
        })
        settingUp = false;

        //@ts-ignore
        castTestCase({ foo: "A" });

        castTestUnmounted();
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);

        // check cleanup's cleanup
        //@ts-ignore
        expect(sceneCallbacks.size).toBe(0);
    })


    test("CASE: register `scene` and auto cleanup. Execute `scene` cleanup. Expect Autocleanup to be clean", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
        });
        let settingUp = false;
        // defineAutoCleanup((cleanup) => {
        //     if (settingUp) {
        //         return onTestUnmounted(cleanup);
        //     }
        // })
        initFlask({
            rootFlasks: [{
                setupChecker: () => settingUp,
                autoCleanupScheduler: onTestUnmounted
            }]
        })
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });

        const [castSceneEnder, onSceneEnder] = createHook({
            hook: "test-hook",
        });
        const cb = vi.fn(() => { })
        const autoCleanupCallbacks = (<DevListener<typeof onTestUnmounted>>onTestUnmounted).handlers

        settingUp = true;
        let sceneCallbacks: Callbacks;
        sceneSetup((scene) => {
            sceneCallbacks =
                //@ts-expect-error
                scene.endHandlers;
            onTestCase(cb) // modo auto cleanup
            onSceneEnder(() => {
                scene.end();
            })
        })
        settingUp = false;



        //@ts-ignore
        castTestCase({ foo: "A" });

        castSceneEnder();
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1);

        // check cleanup's cleanup

        //@ts-ignore
        expect(sceneCallbacks.size).toBe(0);

        //@ts-ignore
        expect(autoCleanupCallbacks.size).toBe(0);
    })
})