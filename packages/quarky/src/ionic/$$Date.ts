import { defineIonicCollective } from "./IonicDef";

export function installIonizedDate() {
   defineIonicCollective(Date, {
      clone: (date) => new Date(date)
   }, {
      valueOf() {
         // @ts-expect-error
         this.trackModel()
         return this.raw!.valueOf()
      },

      setTime(...args) {
         return this.mutate(raw => raw.setTime(...args), ({ op }) => {
            op.triggerModel()
         })
      }
   })
}