//-@ts-nocheck
import { vi, expect, describe, test, beforeEach } from "vitest";
import { sceneSetup, Scene } from "../../flask/Scene";
import { createHook, DevListener } from "../Hook";
import { $type } from "@rue/utils";
import { Callback, Callbacks, initFlask } from "../../flask";
import { Flask, enflask, flaskSetup } from "../../flask/flask";

// cleanup cleanups if alternative cleanup strategy run
// [X] autocleanup with root flask
// [X] autocleanup with scene as root flask
// [X] autocleanup with no root flask
// [X] enflask
// [ ] access root flask from params

describe("various flask usages where all cleanup strategies should be cleaned up once a cleanup strategy is run", () => {

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
        const unmountedCallbacks = onTestUnmounted.handlers

        settingUp = true;
        const flask = flaskSetup((flask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });
            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
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
    });

    test.only("CASE: With root flask. Root flask unmounts; with rootFlask.onDisposed()", () => {
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

        settingUp = true;
        const flask = flaskSetup((flask, rootFlask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });
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
    });


    test("CASE: With root flask. Flask is disposed", () => {
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
        const flask = flaskSetup((flask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });
            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
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

        expect(testCallbacksC.size).toBe(4);

        flask.dispose();
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


    test("CASE: With root flask. Flask is disposed via event", () => {
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
        const flask = flaskSetup((flask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });
            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
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

        expect(testCallbacksC.size).toBe(4);

        castTestCaseC()
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

    test("CASE: With root flask. Until is triggered", () => {
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
        const flask = flaskSetup((flask) => {
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });
            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
            return flask;
        })
        settingUp = false;
        expect(unmountedCallbacks.size).toBe(6);

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(3);

        castTestCaseC()
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


    test("CASE: No root flask. Flask is disposed", () => {

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
        })

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

        let flask: Flask;
        sceneSetup((scene) => {
            flask = flaskSetup((flask) => {
                onTestCaseA(cb, { until: onTestCaseC });
                onTestCaseB(cbB, { until: onTestCaseC });
                onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
                onTestCaseC(() => flask.dispose());
                return flask;
            });
            onEndItAll(() => scene.end())
        })

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(4);

        castEndItAll();
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

    test("CASE: Scene as root flask. Flask is disposed", () => {

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
        const endItAllHandlers = onEndItAll.handlers


        let flask: Flask;
        let scene: Scene;
        sceneSetup((_scene) => {
            scene = _scene
            flask = flaskSetup((flask) => {
                onTestCaseA(cb, { until: onTestCaseC });
                onTestCaseB(cbB, { until: onTestCaseC });
                onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
                onTestCaseC(() => flask.dispose());
                return flask;
            });
            onEndItAll(() => _scene.end())
        })

        //@ts-expect-error
        const sceneEndHandlers = scene.endHandlers
        expect(sceneEndHandlers.size).toBe(8)

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(4);

        //@ts-expect-error
        flask.dispose();
        expect(testCallbacksA.size).toBe(0);
        expect(testCallbacksB.size).toBe(0);
        expect(testCallbacksC.size).toBe(0);
        expect(endItAllHandlers.size).toBe(1); // scene should not be affected

        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(0);

        // handlers have been removed, expect no additional calls
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);
    });


    test("CASE: Enflask. Scene as root flask. Flask is disposed", () => {

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
        const endItAllHandlers = onEndItAll.handlers

        let flask: Flask;
        const useEnflaskedTest = enflask((_flask) => {
            flask = _flask;
            onTestCaseA(cb, { until: onTestCaseC });
            onTestCaseB(cbB, { until: onTestCaseC });
            onTestCaseD(cbC, { unlessCanceled: onTestCaseC });
            onTestCaseC(() => flask.dispose());
            return _flask;
        });

        let scene: Scene;
        sceneSetup((_scene) => {
            scene = _scene
            const returnValue = useEnflaskedTest();
            expect(returnValue).toBe(flask);
            onEndItAll(() => _scene.end())
        })

        //@ts-expect-error
        const sceneEndHandlers = scene.endHandlers
        expect(sceneEndHandlers.size).toBe(8)

        castTestCaseA();
        castTestCaseA();
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);

        expect(testCallbacksC.size).toBe(4);

        //@ts-expect-error
        flask.dispose();
        expect(testCallbacksA.size).toBe(0);
        expect(testCallbacksB.size).toBe(0);
        expect(testCallbacksC.size).toBe(0);
        expect(endItAllHandlers.size).toBe(1); // scene should not be affected

        //@ts-expect-error
        expect(flask.disposalHandlers.size).toBe(0);

        // handlers have been removed, expect no additional calls
        castTestCaseA();
        expect(cb).toHaveBeenCalledTimes(3);
        castTestCaseB();
        expect(cbB).toHaveBeenCalledTimes(2);
    });

})
