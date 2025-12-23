// @ts-nocheck
import { component, For, If, SuspenseIon } from "@rue/lumo";
import { Ion } from "@rue/quarky";

const RemoteIon = SuspenseIon
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
   const $selectedState = Ion(() => $states()[0], { '.value': WRITABLE })

   const $cities = fetchCities($selectedState)
   const $selectedCity = Ion(() => $cities()[0], { '.value': WRITABLE })

   // TODO:
   // const $selectedCity = Ion(undefined, { 
   //    '@init'() { watch($cities, sync(() => this.value = $cities()[0])) } 
   // })

   return component(
      <>
         {Await($cities.loaded,
            <>
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

               <p style={{ color: ($cities.pending ? 'gray' : 'black') }}>
                  Selection: {$selectedCity}, {(ooo.await($cities.pending, $selectedState))}
               </p>
            </>
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

export function fetchStates() {
   return RemoteIon([], () => {
      ooo.await(new Promise((res) => setTimeout(res, 1000)));
      ooo.return(() => Object.keys(stateCities));
   })
}

// export function fetchCities($selectedState: Ion<string>) {
//    return RemoteIon([], async () => {
//       await $selectedState()
//       await new Promise((res) => {
//          setTimeout(res, 1000)
//       });
//       return stateCities[$selectedState()] ?? [];
//    })
// }

export function fetchCities($selectedState: Ion<string>) {
   return RemoteIon([], () => {
      ooo.await($selectedState)
      ooo.await(new Promise((res) => { setTimeout(res, 1000) }));
      ooo.return(() => stateCities[$selectedState()] ?? []);
   })
}