import { $_run_with_, $_snap_context } from "@rue/flask";
import { component, For, SuspenseIon } from "@rue/lumo";
import { $activeUpdate, instantUpdate, Ion, popUpdate, PRELUDE, pushUpdate, queueIonicTask, runIonicTask, SYNC, watch } from "@rue/quarky";

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

   const $states = fetchStates() // FIX:
   // const $selectedState = Ion(() => $states()[0])
   const $selectedState = Ion(() => (console.trace('>>> get first state'), $states()[0]), { value: null }) // FIX:

   // const $firstState = Ion(() => $states()[0], { '#logAtoms': true })
   // const $selectedState = Ion($firstState())

   // watch($firstState, ({current}) => {
   //    // queueMicrotask(() => {
   //    // instantUpdate(() => {
   //    $selectedState.value = current
   //    // })
   //    // })
   // }, { phase: SYNC })


   console.log('>>> ========== now cities')
   const $cities = fetchCities($selectedState)
   const $selectedCity = Ion(() => (console.log('>>> get first city'), $cities()[0]), { value: null })
   // const $selectedCity = Ion(() => $cities()[0])


   return component(<>
      <select mu:value={$selectedState}>
         {For($states, state =>
            <option>{state}</option>
         )}
      </select>

      <select mu:value={$selectedCity} disabled={($cities.pending)}>
         {For($cities, city =>
            <option>{city}</option>
         )}
      </select>

      <p>Selection: {$selectedCity}, {$selectedState}</p>
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
      console.log('>>> FETCH STATES')
      await new Promise((res) => setTimeout(res, 1000));
      console.log('>>> FETCH STATES resolved')
      return Object.keys(stateCities);
   })
}

export function fetchCities($selectedState: Ion<string>) {
   return AsyncIon([], async () => {
      console.log('>>> FETCH CITIES')
      console.log('>>> =======TRACK $state()')
      $selectedState()
      console.log('>>> =======END TRACK $state()')
      await new Promise((res) => setTimeout(res, 1000));
      console.log('>>> FETCH CITIES resolved')
      return stateCities[$selectedState()] ?? [];
   })
}
export function getStates() {
   return Object.keys(stateCities);
}

export function getCities(state: string) {
   return stateCities[state] ?? [];
}

// fetch states

// get first state
// fetch states X
// fetch Cities

// get first city

// get first state X
// get first state
// get first state
// get first state
// get first state
// get first state
// get first state
// get first state
// get first state
// get first state
// get first state


// >>> fetch states
// >>> get first state

// >>> fetch states // FIX:
// >>> fetch Cities
// >>> get first city


// >>> get first state // FIX:
// () => (console.log(">>> get first state"), $states()[0])
// >>> get first state // FIX:
// () => (console.log(">>> get first state"), $states()[0])
// >>> get first city // FIX:
// () => (console.log(">>> get first city"), $cities()[0])