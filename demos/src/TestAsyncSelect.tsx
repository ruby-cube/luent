import { Await, Awaiting, For, Meanwhile, mountIsland, PRELUDE, SYNC, observe, awaitTick, Ion, awaitPrelude } from "luent";
import { getActiveUpdate, instantUpdate, ion, ooo, tick, untracked } from "@luent/quarky";
import { $_run_with_, $_snap_context, getFlask } from "@luent/flask";

// based on Solid.js/Remix demo

// TODO:
// const $something = ion(null, {
//    '-fetch': () => db.getSomething(),
//    '-dispatch': value => db.setSomething(value),
//    '-awaited': true
// })

const TEST_LATENCY_0 = 1000
const TEST_LATENCY_1 = 500

export function TestAsyncSelect() {

  // const $states = ion([], {
  //   '-fetch': db.fetchStates
  // })

  let resolve: (value: void) => void

  const $pending = ion(new Promise(res => {
    resolve = res
  }) as Promise<void> | null)

  const $states = ion([] as string[])

  awaitPrelude(() => {
    db.fetchStates().then(async res => {
      $pending.value = null
      $states.value = res
      await tick
      resolve()
    })
  })

  const $selectedState = ion(() => $states()[0], {
    '-mutable': true
  })

  let resolveCities: (value: void) => void

  const $pendingCities = ion(new Promise(res => {
    resolveCities = res
  }) as Promise<void> | null)


  const $cities = ion([] as string[])

  const $selectedCity = ion(() => $cities()[0], {
    '-mutable': true
  })

  async function fetchCities(oo: (ion: Ion<any>) => any) {
    console.log('states pending?', $pending())
    const context = $_snap_context()
    const update = getActiveUpdate()
    console.log('update', update)
    await $pending();
    await tick;
    const update2 = getActiveUpdate()
    console.log('update2', update2)
    console.log('$selectedState??', $selectedState()) // async loses effect update context
    return db.fetchCities(oo($selectedState))
  }

  let previous: Promise<string[]> | undefined

  awaitPrelude(oo => {
    const promise = fetchCities(oo);
    if (!('then' in promise)) return;
    if (promise === previous) return;
    if (previous) {
      $pendingCities.value = new Promise(res => {
        resolveCities = res
      }) as Promise<void> | null
    }
    previous = promise;
    promise.then(async res => {
      $pendingCities.value = null
      $cities.value = res
      console.log('UPDATE CITIES', res)
      await tick
      resolveCities()
    })
  })


  observe($selectedState, () => {
    console.log('$selectedState', $selectedState())
  }, { phase: SYNC })

  return <>
    <select mu:value={$selectedState} class='test-select-state'>
      {For($states, $state =>
        <option>{$state}</option>
      )}
    </select>


    <select mu:value={$selectedCity} class='test-select-city' disabled={() => !!$pendingCities()}>
      {For($cities, $city =>
        <option>{$city}</option>
      )}
    </select>

    <p style={{ color: () => $pendingCities() ? 'gray' : 'black' }}>
      Selection: {$selectedCity}, {Awaiting($pendingCities, () => <>{$selectedState()}</>)}
    </p>
  </>
}


export function TestAsyncSelectB() {

  const $states = ion([], {
    '-fetch': db.fetchStates
  })
  const $activeState = ion(() => $states()[0], {
    '-mutable': true
  })

  observe($states, () => {
    console.log('$states', [...$states()])
  }, { phase: SYNC })

  observe($activeState, () => {
    console.log('$activeState', $activeState())
  }, { phase: SYNC })

  const $cities = ion([], {
    '-fetch': async () => { await $states.pending; return db.fetchCities($activeState()) },
    // '-track': [$activeState]
  })
  const $activeCity = ion(() => $cities()[0], {
    '-mutable': true
  })

  return <>
    <div class='test-view' data-test-latency={JSON.stringify([TEST_LATENCY_0, TEST_LATENCY_1])}>
      {Await(<>
        <select mu:value={$activeState} class='test-select-state'>
          {For($states, $state =>
            <option>{$state}</option>
          )}
        </select>

        <select mu:value={$activeCity} class='test-select-city' disabled={() => !!$cities.pending}>
          {For($cities, $city =>
            <option>{$city}</option>
          )}
        </select>

        <p style={{ color: () => $cities.pending ? 'gray' : 'black' }}>
          Selection: {$activeCity}, {Awaiting(() => $cities.pending, $activeState)}
        </p>
      </>)}
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