import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";
import { __devCheckIfTracked } from "./x_DependencyTracker";
import { AnyObject } from "@rue/types";
import { getActiveFlask } from "@rue/flask";
import { quarksOf, QUARKS, Quarks, hasQuarks } from "../QuarkyEntity";
import { __DEV__initTraceability, attachCapsuleMethods, Capsule, CapsuleQuarks } from "../capsule/Capsule";
import { Muon } from "../reactivity/reactivity-system";
import { MaybeIonicAtom } from "./IonicAtom";
import { __DEV__label } from "../debug/DEVLabellable";

/**
* Managed Derivation Ion
* - memoization **
* ---retracking
* - provide previous state to derivation
* - encapsulates with methods
* ---- manage dev traces through quarky capsule **
**/

// /** INTERNAL */
export type $MemoizedIon = Muon & Capsule & {
   [QUARKS]: MemoizedIon
}

/** 
 * INTERNAL 
 * */
export type MemoizedIon =
   Quarks<$MemoizedIon>
   & CapsuleQuarks
   & MaybeIonicAtom
   & MaybeIonicCompound<MemoizedCompound>

export const MEMOIZED_ION = Symbol('Memoized Ion')

export function isMemoizedIon(value: unknown): value is $MemoizedIon {
   return hasQuarks(value) && quarksOf(value).type === MEMOIZED_ION
}



export class MemoizedCompound extends IonicCompound<MemoizedIon> {

   constructor(
      readonly ion: MemoizedIon
   ) {
      super(ion);
   }

   state: unknown;

   override trigger(): void {
      this.dirty = true;
      this.ion.asIonicAtom?.react()
   }
}


export function createMemoizedIon(
   derivation: (previousValue?: unknown) => unknown,
   methods?: AnyObject,
   retrack: boolean = true
) {
   const $memoizedIon = () => {
      const compound = ion.asIonicCompound!;
      const initialized = !!compound.atoms;
      const value = !initialized ? compound.trackAtoms(derivation)
         : (retrack && compound.dirty) ? compound.trackAtoms(() => derivation(compound.state))
            : compound.dirty ? derivation(compound.state)
               : compound.state;

      if (!initialized || compound.dirty)
         compound.state = value;
      compound.dirty = false;
      return value;
   }

   const ion: MemoizedIon = {
      entity: $memoizedIon,
      type: MEMOIZED_ION,
      asIonicAtom: undefined,
      asIonicCompound: undefined,
      __DEV__asTraceable: undefined,
      asReadonly: undefined,
      asReined: undefined,
   }

   const compound = ion.asIonicCompound = new MemoizedCompound(ion)

   $memoizedIon[QUARKS] = ion
   $memoizedIon.__DEV__labelName = undefined
   $memoizedIon.__DEV__label = __DEV__label

   __DEV__initTraceability(ion)

   if (methods) {
      attachCapsuleMethods('MemoizedDerivationIon', $memoizedIon, methods)
   }

   const flask = getActiveFlask()
   if (flask) {
      flask.onDiscard(() => {
         compound.untrackAtoms()
      })
   }

   return $memoizedIon;
}


