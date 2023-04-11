import { describe, test, expect, vi } from "vitest";
import { onDestroyed } from "../../modos/lifecycle-hooks";
import { createHook } from "../Hook";
import { $type } from "@rue/utils";

//NOTE: Skipped during batch test runs

describe.skip("memory leak warnings and safeguards", () => {

    test("CASE: sustained listener with no stop strategy", () => { 
        const [_, onTestCase] = createHook({
            hook: "test-hook",
        })

        const cb = vi.fn(() => { })
        onTestCase(cb);

        //NOTE: Expect console to log appropriate warning: "This listener doesn't have a handler removal strategy..."
    });
    
});

describe.skip("conflicting options should warn", () => {

    test("CASE: once and sustain", () => {
        const [castTestCase, onTestCase] = createHook({
            hook: "test-hook",
            data: $type as {
                foo: "A"
            },
        });
        const cb = vi.fn(() => { })
        
        onTestCase(cb, {once: true, sustain: true});
    });
    
    //NOTE: Expect console to log appropriate warning: "Hook has conflicting options. Choose only one handler removal strategy."
})

describe.skip("out-of-scope Modos lifecycle hooks should warn", () => {

    test("CASE: Modos lifecycle hook is run outside of make function scope", () => {
        onDestroyed(() => { })
    })
    
    //NOTE: Expect console to log appropriate warning: "onDestroyed hook must be run from within a Modos 'make' function scope"
})


