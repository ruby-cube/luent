export function TestAsyncSelect() {

  const $states = ion(db.fetchStates)
  
  const $selectedState = ion(() =>
    oo.await($states, states => states[0]),
    { '-mutable': true }
  )

  const $cities = ion(() =>
    oo.await($selectedState, state => db.fetchCities(state))
  )
  const $selectedCity = ion(() =>
    oo.await($cities, cities => cities[0]),
    { '-mutable': true }
  )

  return <>
    <div>
      {Await(
        <select mu:value={$selectedState}>
          {For($states, $state =>
            <option>{$state}</option>
          )}
        </select>

        <select mu:value={$selectedCity} disabled={() => !!$cities.pending}>
          {For($cities, $city =>
            <option>{$city}</option>
          )}
        </select>

        <p style={{ color: () => $cities.pending ? 'gray' : 'black' }}>
          Selection: {$selectedCity}, {() => oo.await($cities, $selectedState)}
        </p>
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
  fetchCities(selectedState: string | undefined) {
    if (selectedState)
      return new Promise<string[]>((res) => { setTimeout(() => res(stateCities[selectedState]), __TEST__ ? TEST_LATENCY_1 : Math.random() * 5000) })
    return []
  }
}
