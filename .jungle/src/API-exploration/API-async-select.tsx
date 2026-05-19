// @ts-nocheck
import { Component, template, For } from "@rue/luent";
import { Ion } from "@rue/quarky";

function App() {

   const $states = fetchStates();
   const $selectedState = ion($states()[0]);

   const $cities = fetchCities($selectedState);
   const $selectedCity = HybridIon(() => $cities()[0]);

   return Component(
      <>
         <select mu:value={$selectedState}>
            {For($states, state =>
               <option>{state}</option>
            )}
         </select>

         <select mu:value={$selectedCity} disabled={$cities.pending}>
            {For($cities, city =>
               <option>{city}</option>
            )}
         </select>

         <p>Selection: {selectedCity}, {selectedState}</p>
      </>
   )
}



const stateCities: Record<string, string[]> = {
   California: ['Los Angeles', 'San Francisco', 'San Diego'],
   'New York': ['New York City', 'Buffalo', 'Rochester'],
   Florida: ['Miami', 'Orlando', 'Tampa'],
   Texas: ['Houston', 'Dallas', 'Austin'],
   Utah: ['Salt Lake City', 'Provo', 'West Valley City'],
};

function fetchStates() {
   return AsyncIon(() => fetch('...'))
}

function fetchCities($state: Ion<string>) {
   return AsyncIon(() => fetch('...'))
}
