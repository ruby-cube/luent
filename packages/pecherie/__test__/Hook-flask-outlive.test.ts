//-@ts-nocheck
import { vi, expect, describe, test, beforeEach } from "vitest";
import { sceneSetup, Scene } from "../../flask/Scene";
import { createHook, DevListener } from "../Hook";
import { $type } from "@rue/utils";
import { Callback, Callbacks, initFlask } from "../../flask";
import { Flask, OUTLIVE, enflask, flaskSetup } from "../../flask/flask";
import { __resetGlobals } from "../../dev/__resetGlobals";

// cleanup cleanups if alternative cleanup strategy run
// [X] outlive root flask
// [X] outlive root flask, scene as root flask
// [X] outlive without root flask

describe("flask with outlive option--should not be disposed when root flask is disposed", () => {
    beforeEach(__resetGlobals);
    test("CASE: With root flask. Root flask unmounts", () => {
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
        const testCallbacksD = onTestCaseD.handlers
        //@ts-expect-error
        const unmountedCallbacks = onTestUnmounted.handlers

        settingUp = true;
        const flask = flaskSetup((flask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });
            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
            onTestCaseC(() => flask.dispose());
            return flask;
        }, OUTLIVE);
        onTestCaseD(cb);
        settingUp = false;
        expect(unmountedCallbacks.size).toBe(1);

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(4);
        expect(testCallbacksD.size).toBe(2);

        castTestUnmounted();
        expect(testCallbacksA.size).toBe(1);
        expect(testCallbacksB.size).toBe(1);
        expect(testCallbacksC.size).toBe(4);
        expect(testCallbacksD.size).toBe(1);
        expect(unmountedCallbacks.size).toBe(0);

        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(7);

        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(4);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(3);
    });

   
    test("CASE: Scene as root flask. Scene is ended", () => {

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

        const [castEndItAll, onEndItAll] = createHook({
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
        const testCallbacksD = onTestCaseD.handlers

        let scene: Scene
        let flask: Flask;
        sceneSetup((_scene) => {
            scene = _scene;
            flask = flaskSetup((flask) => {
                onTestCaseA(cb, { until: onTestCaseC });
                onTestCaseB(cbB, { until: onTestCaseC });
                onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
                onTestCaseC(() => flask.dispose());
                return flask;
            }, OUTLIVE);
            onTestCaseD(cb)
            onEndItAll(() => _scene.end())
        })
        //@ts-expect-error
        const sceneEndHandlers = scene.endHandlers

        expect(sceneEndHandlers.size).toBe(2);

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(4);
        expect(testCallbacksD.size).toBe(2);

        castEndItAll();
        expect(testCallbacksA.size).toBe(1);
        expect(testCallbacksB.size).toBe(1);
        expect(testCallbacksC.size).toBe(4);
        expect(testCallbacksD.size).toBe(1);
        expect(sceneEndHandlers.size).toBe(0);

        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(7);

        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(4);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(3);
    });


    test("CASE: No root flask. Flask is disposed. Outlive root should have no effect", () => {

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

        const flask = flaskSetup((flask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });
            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
            onTestCaseC(() => flask.dispose());
            return flask;
        }, OUTLIVE)

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(4);

        flask.dispose();
        expect(testCallbacksA.size).toBe(0);
        expect(testCallbacksB.size).toBe(0);
        expect(testCallbacksC.size).toBe(0);

        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(0);

        // handlers have been removed, expect no additional calls
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);
    });

})
