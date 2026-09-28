import { Await, Awaits, For, Meanwhile, mountIsland, PRELUDE, SYNC, observe, ion, awaitTick, Ion, awaitsPrelude, $_preserve_context } from "luent";
// import { addToSuspense, getActiveUpdate, getAwaiting, popUpdate, pushUpdate } from "@luent/quarky";
// import { $_run_with_, $_snap_context, getFlask } from "@luent/flask";

// based on Solid.js/Remix demo

// TODO:
// const $something = ion(null, {
//    '-fetch': () => db.getSomething(),
//    '-dispatch': value => db.setSomething(value),
// })

const TEST_LATENCY_0 = 1000
const TEST_LATENCY_1 = 500

export function TestAsyncSelect() {

  const $states = ion([], {
    '-fetch': db.fetchStates
  })
  const $selectedState = ion(() => $states()[0], {
    '-mutable': true
  })

  observe($states, ({ current, previous }) => {
    // if (current === previous) return;
    console.log('$states', [...$states()])
  }, { phase: SYNC })



  const $cities = ion([], {
    '-fetch': async (oo: (fn: () => any) => any) => {
      const { $_with_context } = $_preserve_context()
      await $states.promised;
      return $_with_context(() => db.fetchCities(oo($selectedState)))
    }
  })
  const $selectedCity = ion(() => $cities()[0], {
    '-mutable': true
  })

  observe($cities, () => {
    console.log('$cities', $cities())
  }, { phase: SYNC })

  return <>
    <div class='test-view' data-test-latency={JSON.stringify([TEST_LATENCY_0, TEST_LATENCY_1])}>
      {Await(view =>
        <>
          <select mu:value={$selectedState} class='test-select-state'>
            {For($states, $state =>
              <option>{$state}</option>
            )}
          </select>

          <select mu:value={$selectedCity} class='test-select-city' disabled={() => view.ifPending(true)}>
            {For($cities, $city =>
              <option>{$city}</option>
            )}
          </select>

          <p style={{ color: () => view.ifPending('gray', 'black') }}>
            Selection: {$selectedCity}, {Awaits($cities, $selectedState)}
          </p>
        </>
      )}
      {Meanwhile(
        <>loading...</>
      )}
    </div>
  </>
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
    console.log('&&& fetchCities', selectedState)
    return new Promise<string[]>((res) => { setTimeout(() => res(stateCities[selectedState]), __TEST__ ? TEST_LATENCY_1 : Math.random() * 5000) })
  }
}

if (__TEST__) mountIsland(TestAsyncSelect, '#root')

