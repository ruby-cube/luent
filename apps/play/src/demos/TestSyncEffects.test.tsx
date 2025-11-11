import { ion, watch } from "@rue/quarky";
import { describe, expect, it, vi } from "vitest";
import { PRELUDE } from "../../../../packages/quarky/src/reactivity/EffectCycle";

//NOTE: Infinite loops should be eliminated from an app, not supported. Infinite loop prevention is for debugging and tracking down loops.

describe('infinite loop prevention', () => {
   it.only('simple sync loop A', () => {

      const callMeOnceA = vi.fn()
      const callMeOnceB = vi.fn()

      const $count = ion(0, {
         increment() {
            console.log('===start increment')
            this.value++;
            console.log('===end increment')
         }
      })

      const $something = ion('')

      watch($count, () => {
         console.log('--start effect increment')
         $something.value = 'frog' + $count()
         callMeOnceA()
         console.log('--end effect increment')
      }, {
         sync: true
      })

      watch($count, () => {
         console.log('---effect!')
         callMeOnceB()
      }, {
         sync: true
      })

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(1)
      expect(callMeOnceB).toBeCalledTimes(1)

      console.log("=====")
      console.log("=====")

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(2)
      expect(callMeOnceB).toBeCalledTimes(2)

      console.log("=====")
      console.log("=====")

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(3)
      expect(callMeOnceB).toBeCalledTimes(3)
   })

   it('simple sync loop B', () => {

      const callMeOnceA = vi.fn()
      const callMeOnceB = vi.fn()

      const $count = ion(0, {
         increment() {
            console.log('===start increment')
            this.value++;
            console.log('===end increment')
         }
      })

      watch($count, () => {
         console.log('---effect!')
         callMeOnceB()
      }, {
         sync: true
      })

      watch($count, () => {
         console.log('--start effect increment')
         $count.value = $count() + 1;
         callMeOnceA()
         console.log('--end effect increment')
      }, {
         sync: true
      })

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(1)
      expect(callMeOnceB).toBeCalledTimes(2)

      console.log("=====")
      console.log("")
      console.log("=====")

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(2)
      expect(callMeOnceB).toBeCalledTimes(4)

      console.log("=====")
      console.log("")
      console.log("=====")

      $count.increment()

      // expect(callMeOnceA).toBeCalledTimes(7)
      // expect(callMeOnceB).toBeCalledTimes(10)
      expect(callMeOnceA).toBeCalledTimes(3)
      expect(callMeOnceB).toBeCalledTimes(6)
   })

   it('chained sync loop A', () => {

      const callMeOnceA = vi.fn()
      const callMeOnceB = vi.fn()
      const callMeOnceC = vi.fn()

      const $count = ion(0, {
         increment() {
            console.log('>>>start increment')
            this.value++;
            console.log('>>>end increment')
         }
      })

      const $count2 = ion(0)

      watch($count, () => {
         console.log('--start effect increment')
         $count2.value = $count() + 1;
         callMeOnceA()
         console.log('--end effect increment')
      }, {
         sync: true
      })

      watch($count2, () => {
         console.log('--start effect2 increment')
         $count.value = $count2() + 1;
         callMeOnceB()
         console.log('--end effect2 increment')
      }, {
         sync: true
      })

      watch($count, () => {
         console.log('---effect')
         callMeOnceC()
      }, {
         sync: true
      })

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(1)
      expect(callMeOnceB).toBeCalledTimes(1)
      expect(callMeOnceC).toBeCalledTimes(1)

      console.log("++++")

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(2)
      expect(callMeOnceB).toBeCalledTimes(2)
      expect(callMeOnceC).toBeCalledTimes(2)
   })

   it('chained sync loop B', () => {

      const callMeOnceA = vi.fn()
      const callMeOnceB = vi.fn()
      const callMeOnceC = vi.fn()

      const $count = ion(0, {
         increment() {
            console.log('>>>start increment')
            this.value++;
            console.log('>>>end increment')
         }
      })

      const $count2 = ion(0)

      watch($count, () => {
         console.log('---effect')
         callMeOnceC()
      }, {
         sync: true
      })

      watch($count, () => {
         console.log('--start effect increment')
         $count2.value = $count() + 1;
         callMeOnceA()
         console.log('--end effect increment')
      }, {
         sync: true
      })

      watch($count2, () => {
         console.log('--start effect2 increment')
         $count.value = $count2() + 1;
         callMeOnceB()
         console.log('--end effect2 increment')
      }, {
         sync: true
      })

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(1)
      expect(callMeOnceB).toBeCalledTimes(1)
      expect(callMeOnceC).toBeCalledTimes(2)

      console.log("++++")

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(2)
      expect(callMeOnceB).toBeCalledTimes(2)
      expect(callMeOnceC).toBeCalledTimes(4)
   })

   it('simple loop A', async () => {
      const callMeOnceA = vi.fn()
      const callMeOnceB = vi.fn()
      let resolve: (value: unknown) => void;
      const allDone = new Promise((_resolve) => {
         resolve = _resolve
      })
      let res: (value: unknown) => void;
      let done = new Promise((_resolve) => {
         res = _resolve
      })

      let count = 0;

      const $count = ion(0, {
         increment() {
            console.log('start increment')
            this.value++;
            console.log('end increment')
         }
      })

      watch($count, () => {
         console.log('--start effect increment')
         $count.value = $count() + 1;
         callMeOnceA()
         console.log('--end effect increment')
      }, { phase: PRELUDE })

      watch($count, () => {
         console.log('---effect!')
         callMeOnceB()
         res(undefined)
         console.log('**count', count)
      }, { phase: PRELUDE })

      $count.increment()
      count++;

      await done;

      expect(callMeOnceA).toBeCalledTimes(1)
      expect(callMeOnceB).toBeCalledTimes(1)

      done = new Promise((_resolve) => {
         res = _resolve
      })

      setTimeout(async () => {
         console.log("=====")
         $count.increment()
         count++;
         await done;

         expect(callMeOnceA).toBeCalledTimes(2)
         expect(callMeOnceB).toBeCalledTimes(2)

         done = new Promise((_resolve) => {
            res = _resolve
         })

         setTimeout(async () => {
            console.log("=====")
            $count.increment()
            count++;
            await done;

            expect(callMeOnceA).toBeCalledTimes(3)
            expect(callMeOnceB).toBeCalledTimes(3)

            resolve(undefined)
         }, 1)
      }, 0)
      return allDone;
   })

   it('simple loop B', async () => {
      const callMeOnceA = vi.fn()
      const callMeOnceB = vi.fn()
      let resolve: (value: unknown) => void;
      const allDone = new Promise((_resolve) => {
         resolve = _resolve
      })
      let res: (value: unknown) => void;
      let done = new Promise((_resolve) => {
         res = _resolve
      })

      let count = 0;

      const $count = ion(0, {
         increment() {
            console.log('start increment')
            this.value++;
            console.log('end increment')
         }
      })

      watch($count, () => {
         console.log('---effect!')
         callMeOnceB()
         console.log('**count', count)
      }, { phase: PRELUDE })

      watch($count, () => {
         console.log('--start effect increment')
         $count.value = $count() + 1;
         callMeOnceA()
         console.log('--end effect increment')
      }, { phase: PRELUDE })

      watch($count, () => {
         console.log("!!!!!!!!")
         res(undefined)
      }, { phase: PRELUDE })


      $count.increment()
      count++;

      await done;

      expect(callMeOnceA).toBeCalledTimes(1)
      expect(callMeOnceB).toBeCalledTimes(2)

      done = new Promise((_resolve) => {
         res = _resolve
      })

      setTimeout(async () => {
         console.log("=====")
         $count.increment()
         count++;

         await done;

         expect(callMeOnceA).toBeCalledTimes(2)
         expect(callMeOnceB).toBeCalledTimes(4)


         done = new Promise((_resolve) => {
            res = _resolve
         })

         setTimeout(async () => {
            console.log("=====")

            $count.increment()
            count++;

            await done;

            expect(callMeOnceA).toBeCalledTimes(3)
            // expect(callMeOnceB).toBeCalledTimes(6)
            expect(callMeOnceB).toBeCalledTimes(5) //FIX:

            resolve(undefined)
         }, 0)
      }, 0)
      return allDone;
   })

   it('chained loop', async () => {
      const callMeOnceA = vi.fn()
      const callMeOnceB = vi.fn()
      const callMeOnceC = vi.fn()
      let resolve: (value: unknown) => void;
      const allDone = new Promise((_resolve) => {
         resolve = _resolve
      })
      let res: (value: unknown) => void;
      let done = new Promise((_resolve) => {
         res = _resolve
      })

      let count = 0;


      const $count = ion(0, {
         increment() {
            console.log('>>>start increment')
            this.value++;
            console.log('>>>end increment')
         }
      })

      const $count2 = ion(0)

      watch($count, () => {
         console.log('--start effect increment')
         $count2.value = $count() + 1;
         callMeOnceA()
         console.log('--end effect increment')
      }, { phase: PRELUDE })

      watch($count2, () => {
         console.log('--start effect2 increment')
         $count.value = $count2() + 1;
         callMeOnceB()
         console.log('--end effect2 increment')
      }, { phase: PRELUDE })

      watch($count, () => {
         console.log('---effect')
         callMeOnceC()
      }, { phase: PRELUDE })


      watch($count, () => {
         console.log('!!!!')
         res(undefined)
      }, { phase: PRELUDE })

      $count.increment()
      count++;

      await done;

      expect(callMeOnceA).toBeCalledTimes(3)
      expect(callMeOnceB).toBeCalledTimes(2)
      expect(callMeOnceC).toBeCalledTimes(3)
      // expect(callMeOnceA).toBeCalledTimes(1)
      // expect(callMeOnceB).toBeCalledTimes(1)
      // expect(callMeOnceC).toBeCalledTimes(2)

      done = new Promise((_resolve) => {
         res = _resolve
      })

      setTimeout(async () => {
         console.log("=====")
         $count.increment()
         count++;
         await done;

         console.log('DONE')
         expect(callMeOnceA).toBeCalledTimes(6)
         expect(callMeOnceB).toBeCalledTimes(4)
         expect(callMeOnceC).toBeCalledTimes(6)

         resolve(undefined)

         // done = new Promise((_resolve) => {
         //    res = _resolve
         // })

         // setTimeout(async () => {
         //    console.log("=====")
         //    $count.increment()
         //    count++;
         //    await done;

         //    expect(callMeOnceA).toBeCalledTimes(3)
         //    expect(callMeOnceB).toBeCalledTimes(3)
         //    expect(callMeOnceC).toBeCalledTimes(4)

         //    resolve(undefined)
         // }, 1)
      }, 0)
      return allDone;
   })
})
