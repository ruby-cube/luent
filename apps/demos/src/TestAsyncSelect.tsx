import { Await, template, For, Meanwhile, Nonce, Suspense } from "@rue/lumo";
import { Ion, isPending, o } from "@rue/quarky";

// based on Solid.js/Remix demo

// TODO:
// const $something = Ion(null, {
//    '-fetch': () => db.getSomething(),
//    '-dispatch': value => db.setSomething(value),
//    '-awaited': true
// })


export function TestAsyncSelect() {

   const $states = Ion((['']), {
      '-fetch': () => db.fetchStates()
   })
   const $activeState = Ion(() => $states()[0], {
      '-writable': true
   })

   const $cities = Ion((['']), {
      '-fetch': () => $activeState() ? db.fetchCities($activeState()!) : []
   })
   const $activeCity = Ion(() => $cities()[0], {
      '-writable': true
   })

   return template(
      <>
         {Await($cities,
            <>
               <select mu:value={$activeState}>
                  {For($states, $state =>
                     <option>{$state}</option>
                  )}
               </select>

               <select mu:value={$activeCity} disabled={(!!$cities.pending)}>
                  {For($cities, $city =>
                     <option>{$city}</option>
                  )}
               </select>

               <p style={{ color: ($cities.pending ? 'gray' : 'black') }}>
                  Selection: {$activeCity}, {(o.await($cities, $activeState))}
               </p>
            </>
         )}
         {Nonce(() =>  // `Nonce` renders only once (during initial load). `Meanwhile` renders whenever awaited entity goes into a pending state
            'loading...'
         )}

         {/* {Meanwhile(() =>
            $cities.loaded || 'loading...'
         )} */}
      </>
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
      return new Promise<string[]>((res) => setTimeout(() => res(Object.keys(stateCities)), Math.random() * 1000))
   },
   fetchCities(selectedState: string) {
      return new Promise<string[]>((res) => { setTimeout(() => res(stateCities[selectedState]), Math.random() * 1000) })
   }
}