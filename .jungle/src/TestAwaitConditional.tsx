// @ts-nocheck
import { component, Await, template, Else, If, Meanwhile } from "luent";
import { Ion,ion, Suspense } from "@luent/quarky";

export function TestAwaitConditional() {

   const $active = ion(true, {
      toggle() {
         $active.value = !$active()
      }
   })

   let cache;

   return (

      <>
         <div>
            <loadingBar loading={ooo} />
            <button on:click={e => $active.toggle()}>CHANGE</button>
            <create-view
               await={[$cities, 'view']} 
               suspense={$awaitingTab} 
               meanwhile={o => o.initial && 'loading...'}
            >
               {If($active,
                  <div before:mount={() => console.log('CREATE A')}>
                     <Child state='awake'></Child>
                  </div>
               )}
               {Else(
                  <div before:mount={() => console.log('CREATE B')}>
                     <Child state='sleeping'></Child>
                  </div>
               )}
            </create-view>
         </div>

         <div>
            <loadingBar loading={ooo} />
            <button on:click={e => $active.toggle()}>CHANGE</button>
            <create-view
               await={$suspense}
               meanwhile={o => o.initial && 'loading...'}
            >
               {If($active,
                  <div before:mount={() => console.log('CREATE A')}>
                     <Child state='awake'></Child>
                  </div>
               )}
               {Else(
                  <div before:mount={() => console.log('CREATE B')}>
                     <Child state='sleeping'></Child>
                  </div>
               )}
            </create-view>
         </div>
      </>
   )
}


export function Child(setup: { state: 'awake' | 'sleeping' }) {
   const { state } = setup
   const $something = ion(0, {
      '-fetch': () => db.fetchSomething(),
      '-awaited': true
   })
   return (

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