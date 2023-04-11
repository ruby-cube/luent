//-@ts-nocheck
import { vi, expect, describe, test, beforeEach } from "vitest";
import { beginScene, Scene } from "../../planify/Scene";
import { defineAutoCleanup } from "../../planify/scheduleAutoCleanup";
import { createHook, DevListener } from "../Hook";
import { $type } from "@rue/utils";




describe("cleanup functions are cleaned up if a different cleanup strategy executes", () => {

    test("CASE: register until and auto cleanup. Execute auto cleanup. Expect until's callback to be gone", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
        });
        let settingUp = false;
        defineAutoCleanup((cleanup) => { //Beware: this sets a global variable that will affect subsequent tests
            if (settingUp) {
                return onTestUnmounted(cleanup);
            }
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
        onTestCase(cb, { until: onSomethingEnded }) // modo auto cleanup
        settingUp = false;


        castTestCase({ foo: "A" });
        expect(cb).toHaveBeenCalledTimes(1)

        castTestUnmounted();
        castTestCase({ foo: "A" });
        castTestCase({ foo: "A" });

        expect(cb).toHaveBeenCalledTimes(1);

        const handlers = (<DevListener<typeof onSomethingEnded>>onSomethingEnded).handlers
        expect(handlers.size).toBe(0);

        const autoCleanupCallbacks = (<DevListener<typeof onTestUnmounted>>onTestUnmounted).handlers
        expect(autoCleanupCallbacks.size).toBe(0);
    })

    test("CASE: register until and auto cleanup. Execute until. Expect autocleanup's callback to be gone", () => {
        const [castTestUnmounted, onTestUnmounted] = createHook({
            hook: "test-unmounted-hook",
        });
        let settingUp = false;
        defineAutoCleanup((cleanup) => { //Beware: this sets a global variable that will affect subsequent tests
            if (settingUp) {
                return onTestUnmounted(cleanup);
            }
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
        let sceneCallbacks: DevListener<Scene["onEnded"]>["handlers"];
        beginScene((scene) => {
            sceneCallbacks = (<DevListener<Scene["onEnded"]>>scene.onEnded).handlers;
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
        let sceneCallbacks: DevListener<Scene["onEnded"]>["handlers"];
        beginScene((scene) => {
            sceneCallbacks = (<DevListener<Scene["onEnded"]>>scene.onEnded).handlers;
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
        defineAutoCleanup((cleanup) => {
            if (settingUp) {
                return onTestUnmounted(cleanup);
            }
        })
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });

        const cb = vi.fn(() => { })

        let sceneCallbacks: DevListener<Scene["onEnded"]>["handlers"];
        settingUp = true;
        beginScene((scene) => {
            sceneCallbacks = (<DevListener<Scene["onEnded"]>>scene.onEnded).handlers;
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
        defineAutoCleanup((cleanup) => {
            if (settingUp) {
                return onTestUnmounted(cleanup);
            }
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
        let sceneCallbacks: DevListener<Scene["onEnded"]>["handlers"];

        settingUp = true;
        beginScene((scene) => {
            sceneCallbacks = (<DevListener<Scene["onEnded"]>>scene.onEnded).handlers;
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