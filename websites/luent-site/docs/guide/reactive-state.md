# Reactive State
TODO: writable derivations
Reactivity refers to the ability of state changes to trigger reactions, such as view updates. In Luent, ions are the fundamental units of reactivity. They are the building blocks of ionic compounds, which may take the form of compound ions, ionic objects, ionic collections, and ionic tasks.

## Ions
Ions are state accessor functions whose state may be tracked for changes. When an ion's state changes, it triggers all reactions that track the ion. 

There are two main types of ions: atomic ions and compound ions.


### Atomic Ions
Atomic ions are irreducible sources of reactivity. All atomic ions are writable, exposing a `value` property that may be [set to a new value](#writing-ion-state) to change the ion's state.

#### Creating an atomic ion
To create an atomic ion, pass its initial state to `ion()`. Note that functions represent derivations rather than state and therefore cannot be used as atomic ion state.
```tsx
const $count = ion(0) // type: MutableIon<number>
```
::: info Type definitions
```tsx
interface MutableIon<T> {
  (): T
  value: T
}
```
:::

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Compound Ions
Compound ions derive their state and reactivity from ions accessed within their derivation.

#### Creating a compound ion
To create a compound ion, pass a derivation function to `ion()`.
```tsx
const $maxed = ion(() => $count() >= limit) // type: Ion<boolean>
```
::: info Type definitions
```tsx
interface Ion<T> {
  (): T
}
```
:::

<br></br>

#### A note on derivations

Keep in mind, derivations are:

- **side-effect free:** Derivation functions must not mutate state. Doing so will lead to unpredictable behavior.
  ```tsx
  const $foo = ion(() => $bar.value++) // ❌
  ```

- **synchronously tracked:** Only reactive state that is accessed *synchronously* within a derivation can be tracked. If you need to track reactive state that is accessed asynchronously, simply include an access statement at the top of the derivation.
  ```tsx
  // example?
  track()
  ```
- **potentially inert**: A compound ion is inert when its derivation does not access any reactive state. This allows component inputs to be normalized into compound ions regardless of whether the consumer passes static or reactive values.
  ```tsx
  // example?
  ```
<br></br>

#### Deriving from previous state
The `ion()` function passes the previous state to derivations, which can be used to derive the next state. 
```ts
const $delta = ion(0)
const $total = ion((prev = 0) => prev + $delta())
```
When the derivation is called for the first time, the previous state will be undefined. An initial previous state can be provided through a default parameter.

<br></br>

#### Memoization of derived state
By default, the `ion()` function memoizes derived state, recomputing it only when one of its dependencies changes. This avoids unnecessary recomputation across multiple reads and is typically the most efficient behavior. 

To create an unmemoized compound ion, declare it as a simple arrow function expression.
```ts
const $username = () => user.name
```

If `ion()` features are needed (to create, for example, a [settable compound ion]()), memoization may be disabled through the option flag `{ '-memoize': false }`.
```ts
const $username = ion(() => user.name, { 
  '-memoize': false,
  '@set'(name: string) {
    user.name = name
  }
})
```

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Inline Derivations
Inline derivations are compound ions created directly within another expression. They are typically unmemoized, created in the form of an arrow function expression. 

```tsx
<button 
  on:click={increment} 
  disabled={() => $count() > limit} // inline derivation
>
  +
</button>
```
```tsx
track(() => $count() > limit, () => {
  console.log('over the limit!')
})
```
Memoized derivations may also be created inline, though assigning them to variables is generally preferred for readability.

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Reading ion state
To access an ion's state, call the ion:
```tsx
const count = $count()
                  |
                 call
```
An ion's state may also be accessed through its `value` property (for example, `$count.value`). This is primarily useful for operators that both read and write state, such as the increment operator,`++`.

For pure reads, accessing state through `.value` is discouraged because it is more verbose. Additionally, reserving the syntax `$state.value` for writes makes mutations easier to identify when reading code.

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Writing ion state
To update an ion's state, set its `value` property:

```tsx
/* assignment */
$count.value = 5

/* compound assignment */
$count.value += 2
$count.value++

/* destructuring assignment */
[$count.value] = array
```

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Ions with methods
```tsx
const $count = ion(0, {
  increment() {
    $count.value++
  },
  decrement() {
    $count.value--
  }
})
```
```tsx
<button on:click={$count.increment}>+</button>
```
<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Encapsulated ions
```tsx
const $count = ion(0, {
  '-capsule': true, // capsule flag
  increment() {
    this.value++
  },
  decrement() {
    this.value--
  }
})

$count.value = 5 // TypeError: Property 'value' does not exist on type '() => number'.
```
```tsx
<button on:click={() => $count.increment()}>+</button>
```

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Tracking ion state
Ions may be tracked for state changes by reactive effects--functions that will run whenever the tracked state changes.

```tsx
/* runs reaction whenever $count's state changes */
track($count, () => {
  console.log('Count:', $count())
})
```

Tracking compound ions:
```tsx
/* runs reaction whenever $count's state changes */
track(() => $count() > limit, () => {
  console.log('over the limit!')
})
```
By default, reactive effects run asynchronously from the state mutation. For in-depth guide phases and options, see: [Tracking Ions]()

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Rendering reactively
```tsx
<div>{$count}</div>
        |
       passes in the ion
```
::: info Transpiled
(simplified for demonstration purposes)
```ts
jsx('div', {
  Slot: () => [$count] // passes in the ion
})
```
:::
::: info Under the hood of `jsx()`
(simplified for demonstration purposes)
```ts
const textNode = document.createTextNode(ion())

/* updates text node whenever ion's state changes */
track(ion, () => {
  textNode.data = ion()
})
```
:::
<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Rendering statically
```tsx
<div>initial count: {$count()}</div>
                        |
                    passes in the value
```
::: info Transpiled
(simplified for demonstration purposes)
```ts
jsx('div', {
  Slot: () => [$count()] // passes in the value
})
```
:::
::: info Under the hood of `jsx()`
(simplified for demonstration purposes)
```ts
const textNode = document.createTextNode(value)
```
:::
<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Debugging Ions
```tsx
const $count = ion(0, {
  '@set'(value) {
    debug.traceAsync('count', value)
  }
})
```

