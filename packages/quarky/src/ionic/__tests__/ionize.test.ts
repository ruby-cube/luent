//@ts-nocheck
import { describe, expect, it } from "vitest"
import { ionize, isIonicProxy, MARK, withInertItems } from "../ionize"
import { watch } from "../../reactivity/watch"
import { inert, isInert } from "../notes/inert"

// [x] ionize Object
// [] ionize Array
// [] ionize Set
// [] ionize Map
// [x] ionize deeply Object
// [] ionize deeply Array (ionic ops)
// [] ionize deeply Set
// [] ionize deeply Met
// [] absorbed ions
// [] derivation pions
// [] inert
// [] withInertItems
// [] toRaw ??

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
      // setup
      const name1 = 'kermit'
      const frog = ionize({ name: name1 })
      expect(frog.$name).toBeDefined()

      let currentName = frog.name;
      watch(frog.$name!, ({ current: name }) => {
         currentName = name;
      }, { phase: SYNC })

      // change value
      const name2 = 'sir robin';
      expect(frog.name).toBe(name1)
      frog.name = name2;
      expect(frog.name).toBe(name2)

      // effect has run
      expect(currentName).toBe(name2)
   })

   it('should not re-ionize an ionized model', () => {
      const frog = ionize({ name: 'kermit' })
      const frogB = ionize(frog)
      expect(frogB).toBe(frog)
   })

   it('should ionize deeply', async () => {
      // setup
      const name1 = 'kermit'
      const swamp = ionize({ frog: { name: name1 } })
      expect(swamp.frog.$name).toBeDefined()

      let currentName = swamp.frog.name;
      watch(() => (swamp.frog.name), ({ current: name }) => {
         currentName = name;
      }, { phase: SYNC })

      // change value
      const name2 = 'sir robin';
      expect(swamp.frog.name).toBe(name1)
      swamp.frog.name = name2;
      expect(swamp.frog.name).toBe(name2)

      // effect has run
      expect(currentName).toBe(name2)
   })

   it('should not ionize inert objects', () => {
      // setup
      const frog = inert({ name: 'kermit' })
      const frogB = ionize(frog)
      expect(isInert(frogB)).toBe(true)
      expect(frogB).toBe(frog)
      expect(isIonicProxy(frogB)).toBe(false)
   })

   // INERT PROPERTIES VIA NESTING

   it('should not ionize nested inert objects', () => {
      // setup
      const frog = inert({ name: 'kermit' })
      const swamp = ionize({ frog })
      expect(isInert(swamp.frog)).toBe(true)
      expect(swamp.frog).toBe(frog)
      expect(isIonicProxy(swamp.frog)).toBe(false)
   })

   it('should make property inert via nested inert objects (objects assigned to property will be made inert)', () => {
      // setup
      const frog = inert({ name: 'kermit' })
      const swamp = ionize({ frog })
      expect(isInert(swamp.frog)).toBe(true)
      expect(swamp.frog).toBe(frog)
      expect(isIonicProxy(swamp.frog)).toBe(false)
   })

   // [] need to handle properties that could be primitive value | inert object
   // [] need to handle third party objects (mark map)
   // [] avoid requiring symbol property (footgun: { MARK: inert } instead of { [MARK]: inert }) (or use linting/typescript warning/rules?)

   it('should ionize according to mark map with nested inert', () => {
      class Frog {
         constructor(
            public name: string,
            public qualities: { gallant: boolean },
            public details: { location: string }
         ) { }
      }

      const frog = ionize(
         mark(new Frog('kermit', { gallant: true }, { location: 'swamp' }), {
            qualities: inert
         })
      )

      const frog = ionize.mark(new Frog('kermit', { gallant: true }, { location: 'swamp' }), {
         qualities: inertItems
      })

      const frogs = ionize.mark([], inertItems, {
         push() {

         }
      })
   })
})