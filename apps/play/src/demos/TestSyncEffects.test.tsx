import { component } from "@rue/lumo";
import { ion, watch } from "@rue/quarky";
import { describe, expect, it, vi } from "vitest";

describe('infinite loop prevention', () => {
   it('simple sync loop', () => {

      const callMeOnceA = vi.fn()
      const callMeOnceB = vi.fn()

      const $count = ion(0, {
         increment() {
            console.log('start increment')
            this.state++;
            console.log('end increment')
         }
      })

      watch($count, () => {
         console.log('--start effect increment')
         $count.state = $count() + 1;
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

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(2)
      expect(callMeOnceB).toBeCalledTimes(3)

      console.log("=====")

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(3)
      expect(callMeOnceB).toBeCalledTimes(5)
   })

   it('chained sync loop', () => {

      const callMeOnceA = vi.fn()
      const callMeOnceB = vi.fn()
      const callMeTwice = vi.fn()

      const $count = ion(0, {
         increment() {
            console.log('start increment')
            this.state++;
            console.log('end increment')
         }
      })

      const $count2 = ion(0)

      watch($count, () => {
         console.log('--start effect increment')
         $count2.state = $count() + 1;
         callMeOnceA()
         console.log('--end effect increment')
      }, {
         sync: true
      })

      watch($count2, () => {
         console.log('--start effect2 increment')
         $count.state = $count2() + 1;
         callMeOnceB()
         console.log('--end effect2 increment')
      }, {
         sync: true
      })

      watch($count, () => {
         console.log('---effect')
         callMeTwice()
      }, {
         sync: true
      })

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(1)
      expect(callMeOnceB).toBeCalledTimes(1)
      expect(callMeTwice).toBeCalledTimes(2)

      console.log("++++")

      $count.increment()

      expect(callMeOnceA).toBeCalledTimes(2) //1
      expect(callMeOnceB).toBeCalledTimes(2) //1
      expect(callMeTwice).toBeCalledTimes(4) //3
   })
})

// export function TestSyncEffects() {
//    const $count = ion(0, {
//       increment() {
//          this.state++;
//       },
//       decrement() {
//          this.state--;
//       }
//    })

//    const $count2 = ion(0)

//    watch($count, () => {
//       $count2.state = $count() + 1; // this should run once
//       console.log('$count------')
//       console.log('count', $count())
//       console.log('count2', $count2())
//    }, {
//       // sync: true
//    })

//    watch($count2, () => {
//       $count.state = $count2() + 1;  // this should run once
//       console.log('$count2------')
//       console.log('count', $count())
//       console.log('count2', $count2())
//    }, {
//       // sync: true
//    })


//    watch($count, () => {
//       console.log('new count', $count()) // this should run twice
//    }, {
//       // sync: true
//    })

//    return component(
//       <>
//          <button on:click={e => { $count.increment() }}>increment</button>
//       </>
//    )
// }