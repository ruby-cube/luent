import { toPromise } from "@luent/quarky";
import { Await, Awaits, For, Meanwhile, mountIsland, SYNC, observe, ion, awaitTick, Ion, awaitsPrelude, $_preserve_context, If, Catch, RenderTag, Try } from "luent";
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

  const $bebe = ion(0, {
    '-fetch': () => new Promise((res, rej) => {
      // if (Math.random() < 0.3) {
      //   setTimeout(() => rej('hiccup'), 4000)
      // }
      // else {
        setTimeout(() => res('bebe'), 4000)
      // }
    })
  })

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
      try {
        await $states.promised;
        return $_with_context(() => db.fetchCities(oo($selectedState)))
      }
      catch (err) {
        console.log('CATCH ERR', err)
      }
    }
  })

  const $selectedCity = ion(() => $cities()[0], {
    '-mutable': true
  })

  observe($cities, () => {
    console.log('$cities', $cities())
  }, { phase: SYNC })

  let cachedState: string | undefined;

  observe($selectedState, ({ previous }) => {
    cachedState = previous;
  })

  return <>
    <div class='test-view' data-test-latency={JSON.stringify([TEST_LATENCY_0, TEST_LATENCY_1])}>
      {Await(view =>
        <>
          <h1>Hello world</h1>
          <p>{$bebe}</p>

          {Await(view =>
            <>
              {console.log('[BEGIN]')}
              {/* {kaboom()} */}
              <select mu:value={$selectedState} class='test-select-state'>
                {For($states, $state =>
                  <option>{$state}</option>
                )}
              </select>

              <select mu:value={$selectedCity} class='test-select-city' disabled={() => view.ifPending(true) || $cities.ifErred(true)}>
                {For($cities, $city =>
                  <option>{$city}</option>
                )}
              </select>

              <p style={{ color: () => view.ifPending('gray', $cities.ifErred('gray', 'black')) }}>
                Selection: {$selectedCity}, {Awaits($cities, $selectedState)}
              </p>

              <button on:click={() => db.fetchCities.clearCache()}>clear cache</button>

              {If(() => $cities.error,
                <div style='color: red'>Something went wrong.
                  <button on:click={() => $cities.refetch()} disabled={() => $cities.ifPending(true)}>retry</button>
                  {cachedState &&
                    <button on:click={() => { $selectedState.value = cachedState! }}>rollback</button>
                  }
                </div>
              )}
              {console.log('[END]')}
            </>
          )}
          {Meanwhile(
            <>loading...</>
          )}
        </>)}
      {Meanwhile(
        <>loading outer...</>
      )}
      {Catch(error =>
        <div>OH no. {error.message}</div>
      )}

    </div>
  </>
}

function kaboom() {
  throw 'kaboom'
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
    console.log('fetch states')
    return new Promise<string[]>((res) => setTimeout(() => res(Object.keys(stateCities)), __TEST__ ? TEST_LATENCY_0 : Math.random() * 500))
  },
  fetchCities: CachedFetch((selectedState: string) => {
    console.log('&&& fetchCities', selectedState)
    return new Promise<string[]>((res, reject) => {
      // if (Math.random() < 0.3) {
      //   setTimeout(() => reject('uhoh'), __TEST__ ? TEST_LATENCY_1 : Math.random() * 50)
      // }
      // else {
        setTimeout(() => res(stateCities[selectedState]), __TEST__ ? TEST_LATENCY_1 : Math.random() * 500)
      // }
    })
  })
}

function CachedFetch<F>(fetch: F & ((...args: any[]) => any | Promise<any>), options?: { staleTime: number, toCacheKey?: (...args: any) => string }): F & { clearCache(): void, markStale(key: string): void } {

  const cacheMap = new Map()
  const toCacheKey = options?.toCacheKey ?? ((...args: any[]) => args[0])

  function cache<T>(key: string, fetch: () => T | Promise<T>): T {
    if (cacheMap.has(key))
      return cacheMap.get(key);
    const promise = toPromise(fetch())
    promise.then(value => {
      cacheMap.set(key, value)
      return value;
    })
    return promise;
  }

  function cachedFetch(...args: any) {
    return cache(toCacheKey(...args), () => fetch(...args))
  }

  cachedFetch.clearCache = () => cacheMap.clear()
  cachedFetch.markStale = (key: string) => cacheMap.delete(key)

  return cachedFetch
}

if (__TEST__) mountIsland(TestAsyncSelect, '#root')

