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

export function TestAsyncSelectB() {

  // const $states = ion([], {
  //   '-fetch': db.fetchStates
  // })

  let resolve: (value: void) => void


  const $pending = ion(new Promise(res => {
    resolve = res
  }) as Promise<void> | null)

  // const quark = {
  //   $promise: $pending,
  //   cancelIfFetching,
  //   $error: ion(null)
  // }

  const _$states = ion([] as string[])

  const $states = ion(() => {
    // const awaiting = getAwaiting()
    // if (awaiting) addToSuspense(awaiting, quark)
    return _$states()
  })

  awaitPrelude(() => {
    db.fetchStates().then(async res => {
      resolve() // must resolve first
      $pending.value = null
      _$states.value = res
    })
  })

  const $selectedState = ion(() => $states()[0], {
    '-mutable': true
  })

  let resolveCities: (value: void) => void

  const $pendingCities = ion(new Promise(res => {
    resolveCities = res
  }) as Promise<void> | null)


  const _$cities = ion([] as string[])

  const $cities = ion(() => {
    // const awaiting = getAwaiting()
    // if (awaiting) addToSuspense(awaiting, {
    //   $promise: $pendingCities,
    //   cancelIfFetching,
    //   $error: ion(null)
    // })
    return _$cities()
  })

  const $selectedCity = ion(() => $cities()[0], {
    '-mutable': true
  })

  async function fetchCities(oo: (ion: Ion<any>) => any) {
    const { $_with_context } = $_preserve_context()
    await $pending(); // $states.pending
    return $_with_context(() => db.fetchCities(oo($selectedState)));
  }

  let pendingPromise: Promise<unknown> | null = null
  const cancelledPromises = new Set()

  function isFetching() {
    return Boolean(pendingPromise)
  }

  function cancelFetch() {
    cancelledPromises.add(pendingPromise)
    pendingPromise = null
  }

  function cancelIfFetching() {
    if (isFetching()) {
      cancelFetch()
      return true;
    }
    return false
  }

  let previous: Promise<string[]> | undefined

  awaitsPrelude(oo => {
    const promise = fetchCities(oo);
    if (promise === pendingPromise) return;
    cancelIfFetching()
    if (!('then' in promise)) return;
    if (promise === previous) return;
    pendingPromise = promise;
    if (previous) {
      $pendingCities.value = new Promise(res => {
        resolveCities = res
      }) as Promise<void> | null
    }
    previous = promise;
    promise.then(async res => {
      if (cancelledPromises.has(promise)) {
        cancelledPromises.delete(promise)
        // if (reject) {
        //   reject('cancelled')
        //   resolve = null
        //   reject = null
        // }
        return;
      }
      pendingPromise = null;
      resolveCities()
      $pendingCities.value = null
      _$cities.value = res
    })
  })


  observe($selectedState, () => {
    console.log('$selectedState', $selectedState())
  }, { phase: SYNC })

  return <>
    {/* {Await(() => */}
    <>
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
        Selection: {$selectedCity}, {Awaits($pendingCities, () => <>{$selectedState()}</>)}
      </p>
    </>
    {/* )}
    {Meanwhile(() => <>loading...</>)} */}
  </>
}


export function TestAsyncSelect() {

  const $states = ion([], {
    '-fetch': db.fetchStates
  })
  const $selectedState = ion(() => $states()[0], {
    '-mutable': true
  })

  observe($states, () => {
    console.log('$states', [...$states()])
  }, { phase: SYNC })

  observe($selectedState, () => {
    console.log('$selectedState', $selectedState())
  }, { phase: SYNC })

  const $cities = ion([], {
    '-fetch': async (oo: (fn: () => any) => any) => {
      const { $_with_context } = $_preserve_context()
      await $states.pending;
      return $_with_context(() => db.fetchCities(oo($selectedState)))
    }
  })
  const $selectedCity = ion(() => $cities()[0], {
    '-mutable': true
  })

  return <>
    <div class='test-view' data-test-latency={JSON.stringify([TEST_LATENCY_0, TEST_LATENCY_1])}>
      {Await(() =>(console.log('RENDER AWAIT'),<>
        <select mu:value={$selectedState} class='test-select-state'>
          {For($states, $state =>
            <option>{$state}</option>
          )}
        </select>

        <select mu:value={$selectedCity} class='test-select-city' disabled={() => !$cities.resolved}>
          {For($cities, $city =>
            <option>{$city}</option>
          )}
        </select>

        <p style={{ color: () => $cities.resolved ? 'black' : 'gray' }}>
          {/* Selection: {$selectedCity}, {Awaits($cities, $selectedState)} */}
        </p>
      </>))}
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

