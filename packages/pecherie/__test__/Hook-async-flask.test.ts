//-@ts-nocheck
import { vi, expect, describe, test, beforeEach } from "vitest";
import { sceneSetup, Scene } from "../../flask/Scene";
import { createHook, DevListener } from "../Hook";
import { $type } from "@rue/utils";
import { Callback, Callbacks, initFlask } from "../../flask";
import { Flask, enflask, flaskSetup, getFlask, getRootFlask } from "../../flask/flask";
import exp from "constants";

// with root flask
// overlapping flasks
// nested flasks

function fetcher() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("hi");
        }, 5)
    })
}

describe("async flask", () => {

    test.only("CASE: With root flask. getFlask after await. Root flask unmounts. Everything is cleaned up", () => new Promise(async (done) => {
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
        const [castTestCaseA, onTestCaseA] = createHook({
            hook: "test-hook-A",
        })

        const [castTestCaseB, onTestCaseB] = createHook({
            hook: "test-hook-B",
        })

        const [castTestCaseC, onTestCaseC] = createHook({
            hook: "test-hook-C",
        })

        const [castTestCaseD, onTestCaseD] = createHook({
            hook: "test-hook-D",
        })

        const cb = vi.fn(() => { })
        const cbB = vi.fn(() => { })
        const cbC = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacksA = onTestCaseA.handlers
        //@ts-expect-error
        const testCallbacksB = onTestCaseB.handlers
        //@ts-expect-error
        const testCallbacksC = onTestCaseC.handlers
        //@ts-expect-error
        const unmountedCallbacks = onTestUnmounted.handlers

        settingUp = true;
        const flask = await flaskSetup(async (flask, rootFlask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });

            const [result] = await flask.after(fetcher())
            expect(result).toBe("hi");
            const afterFlask = getFlask();
            expect(afterFlask).toBe(flask);
            const afterRootFlask = getRootFlask();
            expect(afterRootFlask).toBe(rootFlask);

            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
            onTestCaseC(() => flask.dispose());
            return flask;
        })
        settingUp = false;

        expect(unmountedCallbacks.size).toBe(7);
        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(7);

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(4);

        castTestUnmounted();
        expect(testCallbacksA.size).toBe(0);
        expect(testCallbacksB.size).toBe(0);
        expect(testCallbacksC.size).toBe(0);
        expect(unmountedCallbacks.size).toBe(0);

        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(0);

        // handlers have been removed, expect no additional calls
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);
        done("test done")
    }));

    test.only("CASE: Nested flask. With root flask. Root flask unmounts; with rootFlask.onDisposed()", () => {
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
        const [castTestCaseA, onTestCaseA] = createHook({
            hook: "test-hook-A",
        })

        const [castTestCaseB, onTestCaseB] = createHook({
            hook: "test-hook-B",
        })

        const [castTestCaseC, onTestCaseC] = createHook({
            hook: "test-hook-C",
        })

        const [castTestCaseD, onTestCaseD] = createHook({
            hook: "test-hook-D",
        })

        const cb = vi.fn(() => { })
        const cbB = vi.fn(() => { })
        const cbC = vi.fn(() => { })
        const cbD = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacksA = onTestCaseA.handlers
        //@ts-expect-error
        const testCallbacksB = onTestCaseB.handlers
        //@ts-expect-error
        const testCallbacksC = onTestCaseC.handlers
        //@ts-expect-error
        const unmountedCallbacks = onTestUnmounted.handlers

        const useNestedFlask = enflask((flask, rootFlask, outerScopeRootFlask) => {
            onTestCaseD(cb);
            const _flask = getFlask();
            const _rootFlask = getRootFlask();
            expect(_flask).toBe(flask);
            expect(_rootFlask).toBe(rootFlask);
            expect(_rootFlask).toStrictEqual(outerScopeRootFlask);
        })

        settingUp = true;
        const flask = flaskSetup((flask, rootFlask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });

            useNestedFlask(rootFlask);
            const _flask = getFlask();
            expect(_flask).toBe(flask);
            const _rootFlask = getRootFlask();
            expect(_rootFlask).toBe(rootFlask);

            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
            onTestCaseC(() => flask.dispose());
            rootFlask.onDisposed(cbD) // adds 2 callbacks to unmounted; cbD and also to cancel
            return flask;
        })
        settingUp = false;
        expect(unmountedCallbacks.size).toBe(10);
        //@ts-ignore
        expect(flask.disposalHandlers.size).toBe(8);


        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(4);

        castTestUnmounted();
        expect(cbD).toHaveBeenCalledTimes(1);
        expect(testCallbacksA.size).toBe(0);
        expect(testCallbacksB.size).toBe(0);
        expect(testCallbacksC.size).toBe(0);
        expect(unmountedCallbacks.size).toBe(0);

        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(0);

        // handlers have been removed, expect no additional calls
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);
    });


    test.only("CASE: Overlapping async flasks. With root flask. Root flask unmounts; with rootFlask.onDisposed()", () => new Promise(async (done) => {
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
        const [castTestCaseA, onTestCaseA] = createHook({
            hook: "test-hook-A",
        })

        const [castTestCaseB, onTestCaseB] = createHook({
            hook: "test-hook-B",
        })

        const [castTestCaseC, onTestCaseC] = createHook({
            hook: "test-hook-C",
        })

        const [castTestCaseD, onTestCaseD] = createHook({
            hook: "test-hook-D",
        })

        const cb = vi.fn(() => { })
        const cbB = vi.fn(() => { })
        const cbC = vi.fn(() => { })
        const cbD = vi.fn(() => { })
        //@ts-expect-error
        const testCallbacksA = onTestCaseA.handlers
        //@ts-expect-error
        const testCallbacksB = onTestCaseB.handlers
        //@ts-expect-error
        const testCallbacksC = onTestCaseC.handlers
        //@ts-expect-error
        const unmountedCallbacks = onTestUnmounted.handlers

        const useOverlappingFlask = enflask((flask, rootFlask, outerScopeRootFlask) => {
            const _flask = getFlask();
            const _rootFlask = getRootFlask();
            expect(_flask).toBe(flask);
            expect(_rootFlask).toBe(rootFlask);
            expect(_rootFlask).toStrictEqual(outerScopeRootFlask);
        })

        settingUp = true;
        const flask = flaskSetup((flask, rootFlask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });

            useOverlappingFlask(rootFlask);
            const _flask = getFlask();
            expect(_flask).toBe(flask);
            const _rootFlask = getRootFlask();
            expect(_rootFlask).toBe(rootFlask);

            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
            onTestCaseC(() => flask.dispose());
            rootFlask.onDisposed(cbD) // adds 2 callbacks to unmounted; cbD and also to cancel
            return flask;
        })
        settingUp = false;
        expect(unmountedCallbacks.size).toBe(9);

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(4);

        castTestUnmounted();
        expect(cbD).toHaveBeenCalledTimes(1);
        expect(testCallbacksA.size).toBe(0);
        expect(testCallbacksB.size).toBe(0);
        expect(testCallbacksC.size).toBe(0);
        expect(unmountedCallbacks.size).toBe(0);

        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(0);

        // handlers have been removed, expect no additional calls
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);
        done("done");
    }));



})
