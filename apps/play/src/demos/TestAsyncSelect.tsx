import { component, For, SuspenseIon } from "@rue/lumo";
import { Ion } from "@rue/quarky";

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
   // const $selectedState = Ion(() => $states()[0])
   const $selectedState = Ion(() => (console.log('>>> get first state'), $states()[0]), { value: null })

   console.log('>>>> now cities')
   const $cities = fetchCities($selectedState)
   // const $selectedCity = Ion(() => (console.log('>>> get first city'), $cities()[0]), { value: null })
   // const $selectedCity = Ion(() => $cities()[0])


   return component(<>
      <select mu:value={$selectedState}>
         {For($states, state =>
            <option>{state}</option>
         )}
      </select>

      {/* <select mu:value={$selectedCity} disabled={$cities.pending}> */}
         {/* {For($cities, city => */}
            {/* <option>{city}</option> */}
         {/* )} */}
      {/* </select> */}

      {/* <p>Selection: {$selectedCity}, {$selectedState}</p> */}
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
      console.trace('>>> FETCH STATES')
      await new Promise((res) => setTimeout(res, 500));
      console.log('>>> FETCH STATES resolved')
      return Object.keys(stateCities);
   })
}

export function fetchCities($state: Ion<string>) {
   return AsyncIon([], async () => {
      // console.log('>>> FETCH CITIES')
      // // $state()
      // await new Promise((res) => setTimeout(res, 500));
      // console.log('>>> FETCH CITIES resolved')
      // return stateCities[$state()] ?? [];
      return []
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