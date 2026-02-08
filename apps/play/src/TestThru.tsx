import { component } from "@rue/lumo";
import { Thru } from "../../../packages/lumo/src/iteratives/Thru";

export function TestThru() {
   return component(
      <div>
         {Thru(5, (count, index) =>
            <div>{count}</div>
         )}
      </div>
   )
}