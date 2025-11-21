import { Constructor, defineIonicCollective } from "./IonicDef";



defineIonicCollective(Iterator as unknown as Constructor, {
   clone: iterator => iterator  // iterator is immutable, therefore doesn't need a clone function
}, {
   next() {
      this.trackModel()
      return this.raw.next();
   }
})
