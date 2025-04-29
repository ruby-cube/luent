//@ts-nocheck
import { AnyObject } from "@rue/types"
import { Inert, inert, markInertProps } from "../../../../packages/quarky/src/ionized/inert"
import { ionize } from "@rue/quarky"

class _ThirdPartyCat {
   stuffs: {
      otherStuffs: {
         purr: number
      }
   }
   fluff!: {
      name: string
   }

   something: number

   constructor() {
      this.stuffs = {
         otherStuffs: {
            purr: 2
         }
      }
      this.something = 9
   }
}

// function ThirdPartyCat() {
//    return markInertProps(new _ThirdPartyCat(), {
//       fluff: true,
//       stuffs: {
//          otherStuffs: true
//       }
//    })
// }

// const animation = ionize(markNested(new AnimationController(), {
//    ctx: inert,
//    canvas: inert
// }))

// const animation = ionize(new AnimationController(), mark({
//    ctx: inert,
//    canvas: inert
// }), {
//    pushItem(a: number) {
//       this.push(a)
//    }
// })

// Deep as default
const animation = ionize.deep(new AnimationController(), {
   [MARKED]: {
      ctx: inert,
      canvas: inert
   }
})

const animation = ionize.deep({
   ctx: inert(undefined),
   canvas: inert(undefined),
   elapsed: 0,
   points: [new Point()]
})

const animation = ionize.deep(new AnimationController(), {
   [MARKED]: { // markMap
      ctx: inert,
      canvas: inert
   },
   pushItem(a: number) {
      this.push(a)
   }
})

const list = ionize([new Doc()])



// Shallow as default
const animation = ionize({
   ctx: inert(undefined),
   canvas: inert(undefined),
   elapsed: 0,
})

const animation = ionize(new AnimationController(), {
   [MARKED]: { // markMap
      ctx: inert,
      canvas: inert
   },
   pushItem(a: number) {
      this.push(a)
   }
})

const list = ionize.shallow([new Doc()])

// const list = ionize([new Doc()], {
//    [MARKED]: {
//       [NUMBER]: inert
//    }
// })

/* Inert
(A) objects marked inert can never be ionizable in the whole app 
    --- CONS: this feels like it could cause problems, 
        because one component might decide they don't need it to be reactive, but another component needs it to be reactive
    --- PROS: You don't have to mark the object inert multiple times throughout the system. It just is inert. 
        CON: But then you have to track down where an object has been marked inert
        CON: You also then have to answer the question, is the inert object deeply inert?
(B) the inert marker only applies to the ionized model
    --- This makes a lot of sense to me. just like we have ion.ionized that makes sure if the value is an object, it will be ionized,
         we provide the ionize function with a blueprint so that it knows what to ionize and what to leave inert.
         If some other component wants to ionize a nested object, then they are free to do so.

 */



const cat = ThirdPartyCat()

const cat$ = ionize(cat)

cat$.stuffs.otherStuffs

cat$.fluff
cat$.stuffs

