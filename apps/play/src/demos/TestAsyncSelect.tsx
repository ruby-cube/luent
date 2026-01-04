import { component, For, If, AsyncIon } from "@rue/lumo";
import { Ion, PRELUDE, swiftUpdate, watch } from "@rue/quarky";
import { normalizeToArray } from "@rue/utils";
import { Await, Meanwhile } from "../../../../packages/lumo/src/boundaries/Await";

const WRITABLE = true

// TODO:
// [] AsyncIon undefined initial state overload
// [] AsyncIon derivation shorthand
// [] Replace If(($cities().length)) with Await($cities), hold, $suspense



export function TestAsyncSelect() {

   const $states = AsyncIon(() => db.fetchStates())
   // const $activeState = Ion($states()?.[0])
   const $activeState = Ion(() => $states()?.[0], { '.value': WRITABLE })
   

   const $cities = AsyncIon(() => $activeState() ? fetchCities($activeState()) : [])
   const $activeCity = Ion(() => $cities()?.[0], { '.value': WRITABLE })

   function fetchCities(state: string) {
      if ($cities.fetching) $cities.cancelFetch()
      return db.fetchCities(state)
   }

   return component(
      <>
         {Await($cities,
            <>
               <select mu:value={$activeState}>
                  {For($states, state =>
                     <option>{state}</option>
                  )}
               </select>

               <select mu:value={$activeCity} disabled={($cities.pending)}>
                  {For($cities, city =>
                     <option>{city}</option>
                  )}
               </select>

               <p style={{ color: ($cities.pending ? 'gray' : 'black') }}>
                  Selection 
                  {/* {($cities.pending ? '' : $activeCity()+',')} {($cities.pending ? '...' : $activeState())} */}
                  {/* Selection: {$activeCity}, {async () => { await $cities.pending; return $activeState() }} */}
                  {/* Selection: {$activeCity}, {AsyncIon(async () => { await $cities.pending; return $activeState() })} */}
                  {/* Selection: {$activeCity}, {(oo.await($cities, $activeState))} */}
               </p>
            </>
         )}
         {Meanwhile(
            $cities.loaded ? undefined : 'loading...'
         )}
      </>
   )
}

// ))) updateIonWithInput
// ))) ** new promise
// ))) updateIonWithInput
// ))) reject
// ))) cancelled Promise {<rejected>: 'cancelled'}
// ))) resolved () => $activeState() ? fetchCities2($activeState()) : []

const stateCities: Record<string, string[]> = {
   'California': ['Los Angeles', 'San Francisco', 'San Diego'],
   'New York': ['New York City', 'Buffalo', 'Rochester'],
   'Florida': ['Miami', 'Orlando', 'Tampa'],
   'Texas': ['Houston', 'Dallas', 'Austin'],
   'Utah': ['Salt Lake City', 'Provo', 'West Valley City'],
};

export function fetchStates() {
   return AsyncIon([], () => db.fetchStates())
   // return AsyncIon([], () => {
   //    oo.await(db.fetchStates());
   //    return oo.awaited
   // })

   // return AsyncIon([], () => {
   //    return oo.await(db.fetchStates());
   // })
}

export function fetchCities($selectedState: Ion<string>) {
   return AsyncIon(() => $selectedState() ? db.fetchCities($selectedState()) : [])
   //  await ready($selectedState)
   // if (!$cities.fetching) return undefined as unknown as Promise<string[]>;
   // return db.fetchCities($selectedState());


   // return AsyncIon([], () => {
   //    watch: $selectedState(); $selectedState()
   //    oo.await($states.pending)
   //    return oo.await(() => db.fetchCities($selectedState()));
   // })

   // return AsyncIon({
   //    initial: [],
   //    watch: $selectedState,
   //    fetch: () => {
   //       oo.await($states.pending)
   //       return oo.await(() => db.fetchCities($selectedState()));
   //    }
   // })
}

function ready<T>($state: Ion<T>) {
   return new Promise<T>(res => {
      if ($state() === undefined) {
         watch($state, ({ current }) => {
            if (current === undefined) return;
            res(current)
         }, { phase: PRELUDE })
      }
      else if ('pending' in $state && $state.pending) {
         return $state.pending
      }
      else res($state())
   })
}

const db = {
   fetchStates() {
      return new Promise<string[]>((res) => setTimeout(() => res(Object.keys(stateCities)), 2000))
   },
   fetchCities(selectedState: string) {
      return new Promise<string[]>((res) => { setTimeout(() => res(stateCities[selectedState]), 2000) })
   }
}