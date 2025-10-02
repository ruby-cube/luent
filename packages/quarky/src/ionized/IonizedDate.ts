import { enlistIonizedMethods, MemberType, trackOp } from "./IonizedMethods";

const date = new Date()
export function installIonizedDate() {
   enlistIonizedMethods(Date,
      {
         valueOf: {
            type: MemberType.TRACKABLE,
            privateState: true,
            op: date.valueOf,
            track: (model, op) => { trackOp(model, "[[INTERNAL]]", 'valueOf') }
         },

         setTime: {
            type: MemberType.MUTATING,
            privateState: true,
            op: date.setTime,
            trigger: (model) => {
               model.triggerOp('[[INTERNAL]]', 'valueOf')
               model.trigger()
            }
         }
      }
   )
}