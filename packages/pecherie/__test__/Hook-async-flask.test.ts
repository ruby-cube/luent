//-@ts-nocheck
import { vi, expect, describe, test, beforeEach } from "vitest";
import { sceneSetup, Scene } from "../../flask/Scene";
import { createHook, DevListener } from "../Hook";
import { $type } from "@rue/utils";
import { Callback, Callbacks, initFlask } from "../../flask";
import { Flask, enflask, flaskSetup, getFlask, getOuterFlask, getRootFlask } from "../../flask/flask";
import exp from "constants";
import { __resetGlobals } from "../../dev/__resetGlobals";

// with root flask
// overlapping flasks
// nested flasks
// [ ] if flask is disposed before setup completes, Promise must reject

function fetcher() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("hi");
        }, 5)
    })
}

describe("async flask", () => {
    beforeEach(__resetGlobals);
    test("CASE: With root flask. getFlask after await. Root flask unmounts. Everything is cleaned up", () => new Promise(async (done) => {
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

})
