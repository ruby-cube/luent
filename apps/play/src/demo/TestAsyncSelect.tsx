import { component, For } from "@rue/lumo";
import { Ion, isPending, o } from "@rue/quarky";
import { Await, Meanwhile, Nonce } from "../../../../packages/lumo/src/boundaries/Await";


// TODO:
// const $some = AsyncIon({
//    fetch: () => db.getSomething(),
//    dispatch: value => db.setSomething(value),
//    optimistic: true,
//    awaited: true
// })


export function TestAsyncSelect() {

   const $states = Ion(([] as string[]), {
      '-fetch': () => db.fetchStates(),
   })
   const $activeState = Ion(() => $states()[0], { '-writable': true })

   const $cities = Ion(([] as string[]), {
      '-fetch': () => $activeState() ? db.fetchCities($activeState()!) : []
   })
   const $activeCity = Ion(() => $cities()[0], { '-writable': true })

   return component(
      <>
         {Await($cities,
            <>
               <select mu:value={$activeState}>
                  {For($states, state =>
                     <option>{state}</option>
                  )}
               </select>

               <select mu:value={$activeCity} disabled={(!!$cities.pending)}>
                  {For($cities, city =>
                     <option>{city}</option>
                  )}
               </select>

               <p style={{ color: ($cities.pending ? 'gray' : 'black') }}>
                  Selection: {$activeCity}, {(o.await($cities, $activeState))}
               </p>
            </>
         )}
         {Nonce(() =>
            'loading...'
         )}

         {/* {Meanwhile(o =>  
            $cities.loaded ? undefined : 'loading...'
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
      return new Promise<string[]>((res) => setTimeout(() => res(Object.keys(stateCities)), 2000))
   },
   fetchCities(selectedState: string) {
      return new Promise<string[]>((res) => { setTimeout(() => res(stateCities[selectedState]), 2000) })
   }
}