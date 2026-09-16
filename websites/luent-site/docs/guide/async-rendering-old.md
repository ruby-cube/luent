# Async rendering
In Luent, suspense refers to pending state based on one or more promises. It is essentially a batch promise similar to `Promise.all()` that resolves based on the parallel promises of async ions. 

There are two ways to create suspense:
- through a suspense boundary created by `Await()`
- through manual suspense creation

## Suspense boundaries
`Await()` delineates a suspense boundary that encompasses any awaited async ions within the awaited view but outside of any nested awaited views. Awaited async ions are ions created with the `{ '-awaited': true }` option.

The awaited view is not rendered until suspense is unresolved.

```tsx
<div>
  {Await(
    <Foo/>
  )}
</div>
```
```tsx
function Foo() {

  const $list = ion([], {
    '-fetch': fetchList,
    '-awaited': true
  })

  return (
    <ul>
      {For($list, item =>
        <li>{item}<li>
      )}
      {Await(
        <Bar/>
      )}
    </ul>
  )
}
```
Notice in the above example, there are two suspense boundaries. `Await(<Foo/>)` will not wait for any awaited async ions within `<Bar/>`.

## Rendering suspense views
When a suspense boundary is created by `Await()`, a suspense view (placeholder) can be rendered while the awaited view is pending. 

`Meanwhile()` renders an initial loading view before the awaited view has resolved. `Twiddle()` renders subsequent placeholder views if the awaited view becomes pending again.

```tsx
<div>
  {Await(
    <Foo/>
  )}
  {Meanwhile(<Loading/>)}
  {Twiddle(<Skeleton/>)}
</div>
```


## Rendering suspense in resolved views
Refetching awaited async ions causes resolved views to re-enter a pending state. If a suspense view is not provided for subsequent pending states via `Twiddle()`, suspense may be rendered in the resolved view itself via the `$suspense` argument. 

The `$suspense` argument is the [suspense ion](#manual-suspense) created by `Await()`. It contains an unresolved batch promise, indicating a pending state, or null, indicating a resolved state.
```tsx
<div>
  {Await($suspense =>
    <div class={{ 'pending': $suspense }}>
      <Foo/>
    </div>
  )}
  {Meanwhile(
    <Loading/>
  )}
</div>
```

## Manual Suspense
A suspense ion--an ion containing a batch promise or `null`--may be created with `Suspense()`. Promises are then collected by the suspense ion by passing it to an async ion's `'-awaited'` option. 

```tsx
function App() {
  const $suspense = Suspense()

  const $a = ion('', {
    '-fetch': fetchA,
    '-awaited': $suspense
  })

  const $b = ion('') {
    '-fetch': fetchA,
    '-awaited': $suspense
  }

  return (
    <div>
      A: {() => $suspense() ? '...' : $a()}
      B: {() => $suspense() ? '...' : $b()}
    </div>
  )
}
```


## Manual suspense with suspense boundaries
`Suspense()` is also useful when pending state should be shared outside a suspense boundary. This allows loading indicators, progress bars, or parent-level UI to reflect the same pending state as the async boundary. 

Simply pass the suspense ion as the first argument of `Await()`.

```tsx
function App() {
  const $suspense = SuspenseIon()

  return (
    <div>
      <ProgressBar pending={$suspense}/>
      <div>
        {Await($suspense,
          <div class={{ 'pending': $suspense }}>
            <Foo/>
          </div>
        )}
        {Meanwhile(
          <Loading/>
        )}
      </div>
    </div>
  )
}
```



A view's pending state is dete
```tsx
function Foo(setup: FromTag<{
  suspense?: Ion<Promise<void> | null>
}>) {
  const { $suspense } = setup

  const $list = ion([], {
    '-fetch': fetchList,
  })

  const $name = ion('', {
    '-fetch': fetchName,
    '-awaited': $suspense ?? true
  })

  return (
    <section>
      <h2>{$name}</h2>
      <ul>
        {For($list, item =>
          <li>{item}<li>
        )}
      </ul>
    </section>
  )
}
```

# Ionic fetching
```ts
const $user

```


Use `Suspense()` when pending state should be shared outside the async boundary. This allows loading indicators, progress bars, or parent-level UI to reflect the same pending state as the async boundary.

```tsx
const $suspense = Suspense()

<ProgressBar pending={$suspense}/>
<div>
  {Await(
    <div class={{ 'pending': $suspense }}>
      <Foo suspense={$suspense}/>
    </div>
  )}
  {Meanwhile(
    <Loading/>
  )}
</div>
```

# Awaiting async ions
`Await()` can also await an async ion rather than a pending view, which is useful when the fetch is initiated outside the view itself.

```tsx
const $cities = ion('', {
  '-fetch': () => fetchCities()
})

<div>
  {Await($cities,
    <div>
      <CitiesTable cities={$cities()}/>
    </div>
  )}
  {Meanwhile(
    <Loading/>
  )}
</div>
```

## Rendering async resolution errors
Similar to the `Try`/`Catch` series, async resolution errors may be rendered through a `Catch()` expression.

```tsx
<div>
  {Await($cities,
    <div>
      <CitiesTable cities={$cities()}/>
    </div>
  )}
  {Meanwhile(
    <Loading/>
  )}
  {Catch((error, refetch) =>
    <FailureNotice error={error} retry={refetch}/>
  )}
</div>
```
<p align="right"><a href="#async-rendering">[top]</a></p>

:::info Under construction
This article is a work in progress and may contain incomplete documentation.
:::