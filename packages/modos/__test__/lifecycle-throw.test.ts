import { describe, expect, test } from "vitest"
import { onDestroyed } from "../lifecycle-hooks"

describe("out-of-scope Modos lifecycle hooks should throw", () => {
    test("CASE: Modos lifecycle hook is run outside of make function scope", () => {
        expect(()=>onDestroyed(() => { })).toThrowError()

    })
})
