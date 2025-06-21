import { AnyObject } from "@rue/types";
import { JSXNode } from "../node/makeNode";
import { component } from "../component/Component";

export type TryNodeInput = {
   catch?: (error: Error) => JSXNode
}

export function createTryNode<T extends AnyObject>(Slot: () => JSXNode, input: TryNodeInput) {
   const { catch: _catch } = input;
   if (!(isFunction(Slot))) throw new Error('Slot must be a function')

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

