import { INTERNAL_OP } from "./Ionic";
import { defineIonicStructure } from "./IonicMethods";

export function installIonizedDate() {
   defineIonicStructure(Date, {
      valueOf() {   
         // @ts-expect-error
         this.trackModel()
         return this.raw.valueOf()
      },
      // {
      //    type: MemberType.TRACKABLE,
      //    privateState: true,
      //    op: date.valueOf,
      //    track: (model, op) => { trackOp(model, "[[INTERNAL]]", 'valueOf') }
      // },

      setTime(...args) {
         this.triggerModel()
         return this.raw.setTime(...args)
      }
      // {
      //    type: MemberType.MUTATING,
      //    privateState: true,
      //    op: date.setTime,
      //    trigger: (model) => {
      //       model.triggerOp('[[INTERNAL]]', 'valueOf')
      //       model.trigger()
      //    }
      // }
   })
}