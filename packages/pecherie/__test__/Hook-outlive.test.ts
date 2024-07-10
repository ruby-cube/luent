//-@ts-nocheck
import { vi, expect, describe, test, beforeEach } from "vitest";
import { sceneSetup, Scene } from "../../flask/Scene";
import { createHook, DevListener } from "../Hook";
import { outlive, PendingOp, initFlask } from "../../flask";
import { survivingRemovers } from "../../flask/outlive";
import { __resetGlobals } from "../../dev/__resetGlobals";

// Describe: Handlers and removers will outlive scope
// Cases:
// DONE auto cleanup with unmounted
// DONE auto cleanup with scene
// DONE until
// DONE unless canceled

// Describe: survivingRemover's cleanup
// Cases:
// DONE until is called
// DONE callback is called -- one-time listener
// DONE cancel is called
// DONE .cancel() is called


describe(`hooks (and removers) configured with outlive will survive scope disposal (either component setup or scene disposal); 
survivingRemovers will be cleaned up once handler is run or removed`, () => {
    beforeEach(__resetGlobals);
    test("CASE: register until and auto cleanup. Execute auto cleanup. Expect handler and until remover to survive", () => {
        survivingRemovers.clear();
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
            covertFlasks: [{
                setupChecker: () => settingUp,
                autoCleanupScheduler: onTestUnmounted
            }]
        })

        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
        });
        const [castSomethingEnded, onSomethingEnded] = createHook({
            hook: "test-hook",
        });

        const cb = vi.fn(() => { })

        settingUp = true;
        onTestCase(cb, { until: onSomethingEnded, outlive }) // modo auto cleanup
        settingUp = false;

        expect(survivingRemovers.size).toBe(1) // survivingRemover registered

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(1)

        const autoCleanupCallbacks = (<DevListener<typeof onTestUnmounted>>onTestUnmounted).handlers
        expect(autoCleanupCallbacks.size).toBe(0); // autocleanup should not be registered

        castTestUnmounted();
        castTestCase();
        castTestCase();

        expect(cb).toHaveBeenCalledTimes(3); // handler survived

        const handlers = (<DevListener<typeof onSomethingEnded>>onSomethingEnded).handlers
        expect(handlers.size).toBe(1); // remover survived
    })

    test("CASE: register cancel and auto cleanup. Execute auto cleanup. Expect handler and cancel remover to survive. Cleanup via callback call", () => {
        survivingRemovers.clear();
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
            covertFlasks: [{
                setupChecker: () => settingUp,
                autoCleanupScheduler: onTestUnmounted
            }]
        })

        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
        });
        const [castSomethingEnded, onSomethingEnded] = createHook({
            hook: "test-hook",
        });

        const cb = vi.fn(() => { })

        settingUp = true;
        onTestCase(cb, { cancel: onSomethingEnded, outlive }) // modo auto cleanup
        settingUp = false;

        expect(survivingRemovers.size).toBe(1) // survivingRemover registered

        const autoCleanupCallbacks = (<DevListener<typeof onTestUnmounted>>onTestUnmounted).handlers
        expect(autoCleanupCallbacks.size).toBe(0); // autocleanup should not be registered

        castTestUnmounted();

        const handlers = (<DevListener<typeof onSomethingEnded>>onSomethingEnded).handlers
        expect(handlers.size).toBe(1); // remover survived

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(1); // handler survived

        // CASE: Cleanup via callback call

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(1); // handler cleaned up

        expect(handlers.size).toBe(0); // remover cleaned up

        expect(survivingRemovers.size).toBe(0) // survivingRemovers cleaned up
    })

    test("CASE: register until in scene. End scene. Expect handler and until remover to survive. Cleanup via until remover call", () => { //TODO:
        survivingRemovers.clear();
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
        });
        const [castSomethingEnded, onSomethingEnded] = createHook({
            hook: "test-hook",
        });

        const cb = vi.fn(() => { })

        const scene = sceneSetup(() => {
            onTestCase(cb, { until: onSomethingEnded, outlive }) // modo auto cleanup
        })

        expect(survivingRemovers.size).toBe(1) // survivingRemover registered

        const sceneCleanupCallbacks =
            //@ts-expect-error
            scene.endHandlers;
        expect(sceneCleanupCallbacks.size).toBe(0); // autocleanup should not be registered

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(1)

        expect(survivingRemovers.size).toBe(1) // survivingRemover registered

        scene.end();

        // Expect handler and until to have survived

        castTestCase();
        castTestCase();

        expect(cb).toHaveBeenCalledTimes(3); // handler survived

        const handlers = (<DevListener<typeof onSomethingEnded>>onSomethingEnded).handlers
        expect(handlers.size).toBe(1); // remover survived


        // Surviving removers cleanup
        castSomethingEnded();

        castTestCase();
        expect(cb).toHaveBeenCalledTimes(3) // handler cleaned up

        expect(handlers.size).toBe(0) // onSomething ended cleaned up

        expect(survivingRemovers.size).toBe(0) // survivingRemovers cleaned up
    })

    test("CASE: register cancel and scene. End scene. Expect handler and cancel remover to survive. Cleanup via cancel remover", () => {
        survivingRemovers.clear();
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
        });
        const [castSomethingEnded, onSomethingEnded] = createHook({
            hook: "test-hook",
        });

        const cb = vi.fn(() => { })

        let pendingOp: PendingOp;
        const scene = sceneSetup(() => {
            pendingOp = onTestCase(cb, { cancel: onSomethingEnded, outlive }) // modo auto cleanup
        })

        expect(survivingRemovers.size).toBe(1) // survivingRemover registered

        const sceneCleanupCallbacks =
            //@ts-expect-error
            scene.endHandlers;
        expect(sceneCleanupCallbacks.size).toBe(0); // autocleanup should not be registered

        scene.end();

        // Expect handler and until to have survived

        const handlers = (<DevListener<typeof onSomethingEnded>>onSomethingEnded).handlers
        expect(handlers.size).toBe(1); // remover survived

        castSomethingEnded();

        // Surviving removers cleanup
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(0); // handler cleaned up

        expect(handlers.size).toBe(0) // onSomething ended cleaned up

        expect(survivingRemovers.size).toBe(0) // survivingRemovers cleaned up
    })


    test("CASE: register cancel and scene. End scene. Expect handler and cancel remover to survive. Cleanup via pendingOp.cancel()", () => {
        survivingRemovers.clear();
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
        });
        const [castSomethingEnded, onSomethingEnded] = createHook({
            hook: "test-hook",
        });

        const cb = vi.fn(() => { })

        let pendingOp: PendingOp;
        const scene = sceneSetup(() => {
            pendingOp = onTestCase(cb, { cancel: onSomethingEnded, outlive }) // modo auto cleanup
        })

        expect(survivingRemovers.size).toBe(1) // survivingRemover registered

        const sceneCleanupCallbacks =
            //@ts-expect-error
            scene.endHandlers;
        expect(sceneCleanupCallbacks.size).toBe(0); // autocleanup should not be registered

        scene.end();

        // Expect handler and until to have survived

        const handlers = (<DevListener<typeof onSomethingEnded>>onSomethingEnded).handlers
        expect(handlers.size).toBe(1); // remover survived

        pendingOp!.cancel();

        // Surviving removers cleanup
        castTestCase();
        expect(cb).toHaveBeenCalledTimes(0); // handler cleaned up

        expect(handlers.size).toBe(0) // onSomething ended cleaned up

        expect(survivingRemovers.size).toBe(0) // survivingRemovers cleaned up
    })

})