# Reactions
// TODO:

track: links a reaction to an ion 

ion: trackable accessor - triggering mutation(s)

examples of trackable accessors
- getter functions


The term 'track' can be used on any we can:
- track an ionic structure
- track an ion
- track a reaction
- track an access operation
- track a mutation

Ultimately, run a reaction when a mutation happens

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

## Tracking ionic tasks
`ionicTick()` tracks trackable access operations (e.g. getter calls, reactive property access, `Array.filter()`, etc) performed *synchronously* within the task.

```ts
ionicTick(() => {
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
By default, `track()` runs reactions at the end of a render cycle, or the tick—after the mutation has been rendered and painted to the screen. To schedule reactions earlier in the render cycle, see [The Render Cycle](/guide/the-render-cycle)


## Effect Cleanup
In the same way that render functions create views with a lifecycle, reactions and event handlers create scenes that have a lifecycle. A scene begins when a reaction runs and ends when the reaction reruns to create a new scene or when an encompassing view is unmounted.

Some reactions will have (side-)effects that need to be cleaned up before the reaction re-runs or is unmounted with an encompassing view.

 at the end of a scene.
See [Cleanup]().