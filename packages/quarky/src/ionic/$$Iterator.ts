import { Constructor, defineIonicCollective } from "./IonicDef";

defineIonicCollective(Iterator as unknown as Constructor, {
   next() {
      this.trackModel()
      return this.raw.next();
   }
})