import { AnyObject } from "@rue/types"
import { Inert, inert, markInertProps } from "../../../packages/quarky/src/ionize/inert"
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

function ThirdPartyCat() {
   return markInertProps(new _ThirdPartyCat(), {
      fluff: true,
      stuffs: {
         otherStuffs: true
      }
   })
}


const cat = ThirdPartyCat()

const cat$ = ionize(cat)

cat$.stuffs.otherStuffs

cat$.fluff
cat$.stuffs

