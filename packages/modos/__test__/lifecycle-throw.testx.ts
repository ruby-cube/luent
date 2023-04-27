import { beforeEach, describe, expect, test } from "vitest"
import { onDestroyed } from "../lifecycle-hooks"
import { __resetGlobals } from "../../dev/__resetGlobals"

describe("out-of-scope Modos lifecycle hooks should throw", () => {
    beforeEach(__resetGlobals)
    test("CASE: Modos lifecycle hook is run outside of make function scope", () => {
        expect(()=>onDestroyed(() => { })).toThrowError()

    })
})
