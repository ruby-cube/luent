import { describe, expect, it } from "vitest"
import { ionize, toRaw } from "../ionize"

describe('ionize', () => {
   it('should extend objects with methods. toRaw() should return the merged object', () => {
      const obj = { hello: 0 }
      const methods = {
         doSomething() { }
      }
      
      const ionizedObj = ionize(obj, methods)
      const rawObject = toRaw(ionizedObj)

      expect(rawObject === obj).toBe(false)
      expect(ionize(rawObject) === ionizedObj).toBe(true)
   })
})