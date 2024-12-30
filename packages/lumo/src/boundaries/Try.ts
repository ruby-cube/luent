import { AnyObject } from "@rue/types";
import { NodeEntity } from "../node/makeNode";
import { component } from "../component/InternalComponent";

export type TryNodeInput = {
   catch?: (error: Error) => NodeEntity
}

export function createTryNode<T extends AnyObject>(Slot: () => NodeEntity, input: TryNodeInput) {
   const { catch: _catch } = input;
   if (!(Slot instanceof Function)) throw new Error('Slot must be a function')

   let output;
   try {
      output = Slot()
   }
   catch (err) {
      if (_catch) {
         output = _catch(err instanceof Error ? err : new Error(<string>err))
      }
      else {
         return undefined;
      }
   }
   finally {
      return output
   }
}

