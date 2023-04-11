import { describe, expect, test } from "vitest";
import { doAction } from "../actionry";

describe("doAction's returns the correct return value", () => {

    test("CASE: return void, action name", () => {
        const returnVal = doAction("returnVoid", () => { })

        expect(returnVal).toBe(undefined);
    })

    test("CASE: return void, action function", () => {
        const returnVal = doAction(returnVoid, () => { })
        function returnVoid() { }

        expect(returnVal).toBe(undefined);
    })

    test("CASE: return string", () => {
        const value = "hi"
        const returnVal = doAction("returnVoid", () => value)

        expect(returnVal).toBe(value);
    })

    test("CASE: return Promise", () => new Promise(async (done) => {
        const value = "hi"
        const returnVal = doAction("returnVoid", () => new Promise((resolve) => {
            resolve(value);
        }))

        expect(returnVal instanceof Promise).toBe(true);

        const result = await returnVal;
        expect(result).toBe(value)

        done("")
    }))

    test("CASE: return Promise, via await", () => new Promise(async (done) => {
        const value = "hi"
        const promise = new Promise((resolve) => {
            resolve(value);
        })
        const returnVal = doAction("returnVoid", async () => {
            return await promise;
        })

        expect(returnVal instanceof Promise).toBe(true);

        const result = await returnVal;
        expect(result).toBe(value)

        done("")
    }))

})