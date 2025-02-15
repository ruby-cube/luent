import { AnyObject } from "@rue/types";
import { isIonizedModel } from "../ionized/ionize";
import { QUARK, QuarkOf, quarkOf } from "../Quark";
import { Atomic } from "../ion/Atomic";

export type MutableEntity = {
   [QUARK]: {
      recordOp: undefined | ((mutation: Mutation) => void);
      mutation: Mutation | undefined
   }
}

export type Mutable = QuarkOf<MutableEntity>


export class Mutation {

   constructor(
      public target: MutableEntity, //QUESTION: make sure these are readonly? Do I want these exposed to app devs? or just for internal use?
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
         target[key] = oldValue; //QUESTION: Should this trigger effects?? or should we set the raw object?
      } else if (isIonizedModel(this.target)) {
         quarkOf(this.target).revertOp(this)
      }
      else {
         if (__DEV__) console.warn('invalid mutation target')
      }
   }
}