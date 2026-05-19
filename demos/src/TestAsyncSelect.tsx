// @ts-nocheck
import { Await, For, Meanwhile, Nonce, createRoot } from "@rue/luent";
import { AsyncIon, Ion, isPending, o, ion } from "@rue/quarky";

// based on Solid.js/Remix demo

// TODO:
// const $something = ion(null, {
//    '-fetch': () => db.getSomething(),
//    '-dispatch': value => db.setSomething(value),
//    '-awaited': true
// })

const TEST_LATENCY_0 = 1000
const TEST_LATENCY_1 = 500



export function TestAsyncSelect() {

   const $states = ion([], {
      '-fetch': () => db.fetchStates()
   })
   const $activeState = ion(() => $states()[0], {
      '-writable': true
   })

   const $cities = ion([], {
      '-fetch': () => $activeState() ? db.fetchCities($activeState()!) : []
   })
   const $activeCity = ion(() => $cities()[0], {
      '-writable': true
   })

   return Component(
      <div class='test-view' data-test-latency={JSON.stringify([TEST_LATENCY_0, TEST_LATENCY_1])}>
         {Await(
            <>
               <select mu:value={$activeState} class='test-select-state'>
                  {For($states, $state =>
                     <option>{$state}</option>
                  )}
               </select>

               <select mu:value={$activeCity} class='test-select-city' disabled={(!!$cities.pending)}>
                  {For($cities, $city =>
                     <option>{$city}</option>
                  )}
               </select>

               <p style={{ color: ($cities.pending ? 'gray' : 'black') }}>
                  {/* Selection: {$activeCity}, {(o.await($cities, $activeState))} */}
                  Selection: {$activeCity}, {(await $cities.pending, $activeState())}
               </p>
            </>
         )}
         {Nonce(() =>  // `Nonce` renders only once (during initial load). `Meanwhile` renders whenever awaited entity goes into a pending state
            'loading...'
         )}

         {/* {Meanwhile(() =>
            $cities.loaded || 'loading...'
         )} */}
      </div>
   )
}

const stateCities: Record<string, string[]> = {
   'California': ['Los Angeles', 'San Francisco', 'San Diego'],
   'New York': ['New York City', 'Buffalo', 'Rochester'],
   'Florida': ['Miami', 'Orlando', 'Tampa'],
   'Texas': ['Houston', 'Dallas', 'Austin'],
   'Utah': ['Salt Lake City', 'Provo', 'West Valley City'],
};

const db = {
   fetchStates() {
      return new Promise<string[]>((res) => setTimeout(() => res(Object.keys(stateCities)), __TEST__ ? TEST_LATENCY_0 : Math.random() * 5000))
   },
   fetchCities(selectedState: string) {
      return new Promise<string[]>((res) => { setTimeout(() => res(stateCities[selectedState]), __TEST__ ? TEST_LATENCY_1 : Math.random() * 5000) })
   }
}

if (__TEST__) createRoot(() =>
   <TestAsyncSelect></TestAsyncSelect>
).mount('#root')