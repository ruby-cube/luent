//@ts-nocheck
import { component, For, If, AsyncIon } from "@rue/lumo";
import { Ion, PRELUDE, queueIonicTask, swiftUpdate, SYNC, watch } from "@rue/quarky";
import { normalizeToArray } from "@rue/utils";
import { Await, Meanwhile } from "../../../../packages/lumo/src/boundaries/Await";

const WRITABLE = true

// TODO:
// [] AsyncIon undefined initial state overload
// [] AsyncIon derivation shorthand
// [] Replace If(($cities().length)) with Await($cities), hold, $suspense



export function TestAsyncSelect() {

   const $states = AsyncIon(() => db.fetchStates())
   const $activeState = Ion(() => $states()?.[0], { '+value': true })
   // const $activeState = Ion(null as null | string, { '+watch': $states, '+derive': () => $states()[0] })

   const $cities = AsyncIon(() => $activeState() ? db.fetchCities($activeState()!) : [])
   const $activeCity = Ion(() => $cities()?.[0], { '+value': true })
   // const $activeCity = Ion(null, { '+watch': $cities, '+derive': () => $cities()[0] })
   // const $state = Ion((prev: any) => $cities.pending ? prev : $activeState())
   const $state = AsyncIon(async () => { await $cities.pending; return $activeState() })

   const $some = AsyncIon({
      fetch: () => db.getSomething(),
      dispatch: value => db.setSomething(value),
      optimistic: true,
      awaited: true
   })

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
                  {/* {($cities.pending ? '' : $activeCity()+',')} {($cities.pending ? '...' : $activeState())} */}
                  {/* Selection: {$activeCity}, {async () => { await $cities.pending; return $activeState() }} */}
                  Selection: {$activeCity}, {$state}
                  {/* Selection: {$activeCity}, {(prev: any) => $cities.pending ? prev : $activeState()} */}
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

const stateCities: Record<string, string[]> = {
   'California': ['Los Angeles', 'San Francisco', 'San Diego'],
   'New York': ['New York City', 'Buffalo', 'Rochester'],
   'Florida': ['Miami', 'Orlando', 'Tampa'],
   'Texas': ['Houston', 'Dallas', 'Austin'],
   'Utah': ['Salt Lake City', 'Provo', 'West Valley City'],
};

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