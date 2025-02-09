import { QUARKS, Quarks } from "../Quarks";
import { Watchable } from "../watch/Watched";
import { CapsuleQuarks } from "../capsule/Capsule";
import { MaybeIonicAtom } from "../compound/Atom";
import { IonicCompound, MaybeIonicCompound } from "../ionic/IonicCompound";
import { AnyObject } from "@rue/types";
import { toRaw } from "./ionize";
import { isIon } from "../ion/Ion";

//TODO: 

// // /** INTERNAL */
export type IonizedModel = {
   [QUARKS]: IonizedModelQuarks
}

/** 
 * INTERNAL 
 * */
export type IonizedModelQuarks =
   Quarks<IonizedModel>
   & Watchable
   & CapsuleQuarks
   & MaybeIonicAtom
   & MaybeIonicCompound<IonizedCompound>

// export const MEMOIZED_ION = Symbol('Memoized Ion')

// export function isMemoizedIon(value: unknown): value is $MemoizedIon {
//    return hasQuarks(value) && quarksOf(value).type === MEMOIZED_ION
// }



export class IonizedCompound extends IonicCompound<IonizedModelQuarks> {

   constructor(
      readonly quarks: IonizedModelQuarks
   ) {
      super(quarks);
   }

   override trigger(): void {
      this.quarks.asAtom?.react()
      this.quarks.asWatched?.triggerEffects()
   }

   collectAbsorbedIons(ionicModel: AnyObject) {
      const target = toRaw(ionicModel);
      for (const key in target) {
         const value = target[key]
         if (isIon(value)) {
            this.track(<MaybeIonicAtom>value)
         }
      }
   }
}