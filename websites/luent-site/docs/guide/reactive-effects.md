# Reactive Effects
// TODO:

track: links an effect to an ion 

ion: trackable accessor - triggering mutation(s)

examples of trackable accessors
- getter functions


The term 'track' can be used on any we can:
- track an ionic structure
- track an ion
- track an effect
- track an access operation
- track a mutation

Ultimately, run an effect when a mutation happens

## Tracking ions
```ts
const $count = ion(0)

track($count, () => {
  console.log('count changed!')
})
```

## Tracking ionic structures
```ts
const list = ionic([])

track(list, () => {
  console.log('list changed!')
})
```
Note that `track()` tracks mutations shallowly.

## Tracking ions of ionic structures
```ts
const $list = ion([])

track($list, () => {
  console.log('list changed!')
})
```
When passed an ion containing an ionic structure, `track()` tracks mutations of the ion as well as shallow mutations of the ionic structure.

## Tracking reactive effects
`trackEffect()` tracks trackable access operations (e.g. getter calls, reactive property access, `Array.filter()`, etc) performed *synchronously* within the task.

```ts
trackEffect(() => {
  if ($qty()) {
    console.log('quantity is', $qty())
    console.log('count is', $count())
  }
  queueMicrotask(() => {
     $foo() // async call, will not be tracked
  })
})
```


## Scheduling
By default, `track()` and `trackEffect()` run effects at the end of a render cycle, or the tick—after the mutation has been rendered and painted to the screen. To schedule effects earlier in the render cycle, see [The Render Cycle](/guide/the-render-cycle)


## Effect Cleanup

See [Cleanup]().