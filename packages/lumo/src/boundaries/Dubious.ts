import { AnyObject } from "@rue/types";
import { NodeEntity } from "../node/makeNode";
import { Component } from "../component/InternalComponent";

export type DubiousNodeInput = {
   standby?: (error: Error) => NodeEntity | NodeEntity[]
}

export function createDubiousNode<T extends AnyObject>(Slot: () => NodeEntity | NodeEntity[], input: DubiousNodeInput) {
   const { standby } = input;
   if (!(Slot instanceof Function)) throw new Error('Slot must be a function')

   let output;
   try {
      output = Slot()
   }
   catch (err) {
      if (standby) {
         output = standby(err instanceof Error ? err : new Error(<string>err))
      }
      else {
         return undefined;
      }
   }
   finally {
      return output
   }
}

