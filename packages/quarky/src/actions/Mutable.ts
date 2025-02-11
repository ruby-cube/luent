import { AnyObject } from "@rue/types";
import { AtomicIon } from "../ion/AtomicIon";
import { isIonizedModel } from "../ionized/ionize";
import { QUARK, QuarkOf, quarkOf } from "../Quark";

export type MutableEntity = {
   [QUARK]: {
      recordOp: undefined | ((mutation: Mutation) => void);
   }
}

export type Mutable = QuarkOf<MutableEntity>


export class Mutation {

   constructor(
      public target: AnyObject | AtomicIon, //QUESTION: make sure these are readonly? Do I want these exposed to app devs? or just for internal use?
      public op: '[[set]]' | string,
      public args: [PropertyKey, unknown] | unknown[],
      public output: unknown,
      public preopData: unknown // old state for [[set]] ops
   ) { }

   undo() {
      if (this.op === '[[set]]') {
         const target = this.target as AnyObject;
         const [key] = this.args as [PropertyKey]
         const oldValue = this.preopData
         target[key] = oldValue;
      } else if (isIonizedModel(this.target)) {
         quarkOf(this.target).revertOp(this)
      }
      else {
         if (__DEV__) console.warn('invalid mutation target')
      }
   }
}