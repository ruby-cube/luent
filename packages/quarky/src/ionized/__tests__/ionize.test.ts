import { describe, expect, it } from "vitest"
import { ionize, toRaw } from "../ionize"
import { watch } from "@rue/quarky"
import exp from "constants"

describe('ionize', () => {
   // it('should extend objects with methods. toRaw() should return the merged object', () => {
   //    const obj = { hello: 0 }
   //    const methods = {
   //       doSomething() { }
   //    }

   //    const ionizedObj = ionize(obj, methods)
   //    const rawObject = toRaw(ionizedObj)

   //    expect(rawObject === obj).toBe(false)
   //    expect(ionize(rawObject) === ionizedObj).toBe(true)
   // })


   it('should make properties reactive', async () => {
      const frog = ionize({ name: 'kermit' })
      const newName = 'sir robin'

      watch(frog.$name!, ({current: name}) => {
         expect()
      }, { sync: true })

   })
})