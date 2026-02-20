// @ts-nocheck
import { Await, template, Else, FromTag, If, Meanwhile } from "@rue/lumo";
import { Ion, Suspense } from "@rue/quarky";

export function TestAwaitConditional() {

   const $active = Ion(true, {
      toggle() {
         $active.value = !$active()
      }
   })

   let cache;

   return template(
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
                  <div at:create={() => console.log('CREATE A')}>
                     <Child state='awake'></Child>
                  </div>
               )}
               {Else(
                  <div at:create={() => console.log('CREATE B')}>
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
                  <div at:create={() => console.log('CREATE A')}>
                     <Child state='awake'></Child>
                  </div>
               )}
               {Else(
                  <div at:create={() => console.log('CREATE B')}>
                     <Child state='sleeping'></Child>
                  </div>
               )}
            </create-view>
         </div>
      </>
   )
}


export function Child(setup: FromTag<{ state: 'awake' | 'sleeping' }>) {
   const { state } = setup
   const $something = Ion(0, {
      '-fetch': () => db.fetchSomething(),
      '-awaited': true
   })
   return template(
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