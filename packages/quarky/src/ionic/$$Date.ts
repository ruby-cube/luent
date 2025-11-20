import { defineIonicCollective } from "./IonicDef";

export function installIonizedDate() {
   defineIonicCollective(Date, {
      valueOf() {   
         // @ts-expect-error
         this.trackModel()
         return this.raw!.valueOf()
      },

      setTime(...args) {
         this.triggerModel()
         return this.raw.setTime(...args)
      }
   })
}