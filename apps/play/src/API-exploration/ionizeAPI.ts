//@ts-nocheck
// [v] can you add methods to an existing ionized model?
//    - No. I don't think so.
// [v] how would you extend an ionized model then? --define a class
// [v] what happens when you spread an ionized model? Do pions spread?
//    - pions will spread along with values { ...frog }
//    - spread values with values() helper { ...values(frog) } //TEST: Ideally ...frog would behave like this and typescript would also follow...
//    - spread pions by using an ions() helper, e.g. { ...ions(frog) }
// [v] absorbed ions rules
// [v] should arrays, sets, and maps have absorbed ion entries?? 
//    - No. I don't think so.
// [v] should arrays, sets, and maps have ion entries??
//    - yes.
// [v] what happens when you nest an ionized model in an ionized model?
//    - we make it raw when we get the chance. since ionized models are deep, it will become an ionized model when accessed

import { ion, ionize } from "@rue/quarky"


const list = ionize([])

const files = ionize(list, { // should console.warn that methods have not been attached
   addFile() {

   }
})

function inert() { }



const frog = ionize.withMap(new Frog(), {
   canvas: inert,
   something: {
      context: inert
   },
   list: [inert],
   set: [inert],
   map: [inert, inert],
   dog: inert
}, {
   addQuality(quality: Quality) {
      this.qualities.push(quality)
   }
})

const list = ionize.withMap([], [inert])

const list = ionize.withMap(new List(), {
   0: inert,
   el: inert
})

// keep list and files in sync
const $files = ion(() => list, {
   addFile(file: File) {
      list.push(file)
   }
})

// this initializes files with list
const files = ionize([...list], {
   addFile() {

   }
})


const frog = ionize({
   // absorbed ion, non-writable like `get name(){}`
   $name,

   // normal properties
   age: $age, // property's value is an ion
   $location: location // property's name looks like an absorbed ion, but isnt'
})

const frog = ionize({ // will ignore values and absorb ions instead
   name: 'kermit',
   $name
})

