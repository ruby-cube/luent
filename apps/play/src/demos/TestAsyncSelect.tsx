//@ts-nocheck
import { $_run_with_, $_snap_context } from "@rue/flask";
import { component, For, SuspenseIon } from "@rue/lumo";
import { $activeUpdate, instantUpdate, Ion, popUpdate, PRELUDE, pushUpdate, queueIonicTask, runIonicTask, SYNC, untrackedCall, watch } from "@rue/quarky";
import { Await } from "../../../../packages/lumo/src/boundaries/Await";

const AsyncIon = SuspenseIon
// derivation
// writable derivation
// overwritable derivation
// - initial value

// async ion
// sync: initial or derivation
// fetch
// dispatch



export function TestAsyncSelect() {

   const $states = fetchStates()
   const $selectedState = Ion(() => $states()[0], { value: null })

   const $cities = fetchCities($selectedState)
   const $selectedCity = Ion(() => $cities()[0], { value: null })

   const $displayedState = AsyncIon(undefined, async () => {
      await $cities.pending
      console.log('@@@ $displayedState')
      return $selectedState()
   })

   return component(
      <>
         <select mu:value={$selectedState}>
            {For($states, state =>
               <option>{state}</option>
            )}
         </select>

         <select mu:value={$selectedCity} disabled={(console.log('@@@ disabled'), $cities.pending)}>
            {For($cities, city =>
               <option>{city}</option>
            )}
         </select>

         <p style={{ color: ($cities.pending ? 'gray' : 'black') }}>
            Selection: {$selectedCity}, {$displayedState}
            {/* Selection: {$selectedCity}, {Await($cities.pending, $selectedState)} */}
         </p>
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

export function fetchStates() {
   return AsyncIon([], async () => {
      await new Promise((res) => setTimeout(res, 1000));
      return Object.keys(stateCities);
   })
}

export function fetchCities($selectedState: Ion<string>) {
   return AsyncIon([], async () => {
      console.log('&&& fetching cities')
      $selectedState()
      await new Promise((res) => setTimeout(res, 1000));
      return stateCities[$selectedState()] ?? [];
   })
}
export function getStates() {
   return Object.keys(stateCities);
}

export function getCities(state: string) {
   return stateCities[state] ?? [];
}