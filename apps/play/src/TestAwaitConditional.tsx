// @ts-nocheck
import { Await, component, Else, FromTag, If, Meanwhile } from "@rue/lumo";
import { Ion, Suspense } from "@rue/quarky";

export function TestAwaitConditional() {

   const $active = Ion(true, {
      toggle() {
         $active.value = !$active()
      }
   })

   let cache;

   return component(
      <div>
         <loadingBar loading={ooo} />
         <button on:click={e => $active.toggle()}>CHANGE</button>
         <create-view meanwhile={ooo => ooo.initial ? 'loading...' : ooo.hold}>
            {If($active, <>
               {Await(() => (cache =
                  <div at:create={() => console.log('CREATE A')}>
                     <Child state='awake'></Child>
                  </div>
               )
               )}
               {Meanwhile(o => o.initial ? 'loading...' : cache)}
            </>)}
            {Else(<>
               {Await((cache =
                  <div at:create={() => console.log('CREATE B')}>
                     <Child state='sleeping'></Child>
                  </div>
               ))}
               {Meanwhile(o => o.initial ? 'loading...' : cache)}
            </>)}
         </create-view>
      </div>
   )
}


export function Child(setup: FromTag<{ state: 'awake' | 'sleeping' }>) {
   const { state } = setup
   const $something = Ion(0, {
      '-fetch': () => db.fetchSomething(),
      '-awaited': true
   })
   return component(
      <div>
         {state}
         {$something}
      </div>
   )
}

const db = {
   fetchSomething() {
      return new Promise<number>((resolve) => {
         const delay = 2000;
         setTimeout(() => resolve(delay), delay);
      })
   }
}