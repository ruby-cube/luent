import { template } from "@rue/lumo";
import { createAsyncDerivation } from "../../../packages/quarky/src/async/AsyncDerivation";

export function TestAsyncDerivation() {
   const $count = createAsyncDerivation({ fetch: () => fetchCount(), standin: 0 })

   return template(
      <div>
         <h1>Hello world</h1>
         <div>{$count}</div>
      </div>
   )
}

function fetchCount() {
   console.log('### fetchCount')
   return new Promise((resolve) => {
      setTimeout(() => {
         resolve(4)
      }, 1000)
   })
}