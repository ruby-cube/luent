# Reactive State

Reactivity refers to the ability of state changes to trigger reactions, such as re-rendering parts of the view. In Luent, ions are the fundamental units of reactivity. They are the building blocks of ionic compounds, which may take the form of compound ions, ionic objects, ionic collections, and ionic tasks.

## Ions
Ions are state accessor functions whose state may be tracked for changes. When an ion's state changes, it triggers all reactions linked to the ion. 

There are two main types of ions: **atomic ions** and **compound ions**.


### Atomic ions
Atomic ions are irreducible sources of reactivity. Atomic ions are mutable, exposing a [writable](#writing-ion-state) `value` property.

To create an atomic ion, pass its initial state to `ion()`. 
<!-- Note that functions represent derivations rather than state and therefore cannot be used as atomic ion state. -->
```nsx
get count = ion(0) // type: MutableIon<number>
```
```tsx
const $count = ion(0) // type: MutableIon<number>
```
:::details CODE SWITCH
**React:** `useState()`

**Vue:** `shallowRef()`

**Svelte:** `$state`

**Solid:** `createSignal()`

**Angular:** `signal()`
:::
::: info Type definitions
```nsx
interface MutableIon<T> {
  (): T
  value: T
}
```
```tsx
interface MutableIon<T> {
  (): T
  value: T
}
```
:::

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Compound ions
Compound ions derive their state and reactivity from ions accessed within their derivation.

To create a compound ion, pass a derivation function to `ion()`.
```nsx
get maxed = ion(() => $count() >= limit) // type: Ion<boolean>
```
```tsx
const $maxed = ion(() => $count() >= limit) // type: Ion<boolean>
```
:::details CODE SWITCH
**React:** `useMemo()`

**Vue:** `computed()`

**Svelte:** `$derived`

**Solid:** `createMemo()`

**Angular:** `computed()`
:::
::: info Type definitions
```nsx
interface Ion<T> {
  (): T
}
```
```tsx
interface Ion<T> {
  (): T
}
```
:::
<br>

#### A note on derivations

Keep in mind, derivations are:

- **side-effect free:** Derivation functions must not mutate state. Doing so will lead to unpredictable behavior.
  ```nsx
  get foo = ion(() => bar++) // ❌
  ```
  ```tsx
  const $foo = ion(() => $bar.value++) // ❌
  ```

- **synchronously tracked:** Only reactive state that is accessed *synchronously* within a derivation can be tracked. If you need to track reactive state that is accessed asynchronously, use the `-fetch` option (see [Async Rendering](/guide/async-rendering)).
  <!-- ```tsx
  // example?
  observe()
  ``` -->
- **potentially inert**: A compound ion is inert when its derivation does not access any reactive state. This allows component inputs to be normalized into compound ions regardless of whether the consumer passes static or reactive values.
  <!-- ```tsx
  // example?
  ``` -->
<br>

#### Deriving from previous state
The `ion()` function passes the previous state to derivations, which can be used to derive the next state. 
```ns
get delta = ion(0)
get total = ion((prev = 0) => prev + delta)
```
```ts
const $delta = ion(0)
const $total = ion((prev = 0) => prev + $delta())
```
When the derivation is called for the first time, the previous state will be undefined. An initial previous state can be provided through a default parameter.

<br></br>

#### Memoization of derived state
By default, the `ion()` function memoizes derived state, recomputing it only when one of its dependencies changes. This avoids unnecessary recomputation across multiple reads and is typically the most efficient behavior. 

To create an unmemoized compound ion, declare it as a simple arrow function expression.
```ns
get username = () => user.name
```
```ts
const $username = () => user.name
```

If other `ion()` features are needed (to create, for example, a [settable compound ion]()), memoization may be disabled through the option flag `{ '-memoize': false }`.
```ns
get username = ion(() => user.name, { 
  '-memoize': false,
  '@set'(name: string) {
    user.name = name
  }
})
```
```ts
const $username = ion(() => user.name, { 
  '-memoize': false,
  '@set'(name: string) {
    user.name = name
  }
})
```


<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Inline derivations
Inline derivations are compound ions created directly within another expression. They are typically unmemoized, created in the form of a function expression. 

```nsx
<button 
  on:click={increment} 
  disabled={() => count > limit} // inline derivation
>
  +
</button>
```
```tsx
<button 
  on:click={increment} 
  disabled={() => $count() > limit} // inline derivation
>
  +
</button>
```
```tsx
observe(() => count > limit, () => {
  console.log('over the limit!')
})
```
```tsx
observe(() => $count() > limit, () => {
  console.log('over the limit!')
})
```
Memoized derivations may also be created inline, though assigning them to variables is generally preferred for readability.


<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>


## Ion state
### Reads
To access an ion's state:
```nsx
console.log('The count is', count);
```
```tsx
console.log('The count is', $count()); // call the ion
```
An ion's state may also be accessed through its `value` property. This is primarily useful for operators that both read and write state, such as the increment operator,`++`.

```nsx
console.log(count++)
```
```tsx
console.log($count.value++)
```

For pure reads, accessing state through `.value` is discouraged because it is more verbose. Additionally, reserving the syntax `ion.value` for writes makes mutations easier to spot within the code.

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Writes
To update an ion's state, set its `value` property:

```nsx
/* assignment */
count = 5

/* compound assignment */
count += 2
count++

/* destructuring assignment */
[count] = array
```
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


## Rendering ions

### Rendering reactively

Ions are typically [tracked](#tracking-ions) by the view. When the ion’s state changes, Luent updates the affected portion of the view.

```nsx
<div>{count@}</div>
        |
       pass in the ion
```
```tsx
<div>{$count}</div>
        |
       pass in the ion
```
::: info Transpiled
(simplified for demonstration purposes)
```js
jsx('div', {
  Slot: () => [$count] // pass in the ion
})
```
:::
::: info Under the hood of `jsx()`
(simplified for demonstration purposes)
```js
const textNode = document.createTextNode(ion())

/* updates text node whenever ion's state changes */
observe(ion, () => {
  textNode.data = ion()
})
```
:::

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Rendering statically
An ion may be rendered statically by passing in its value rather than the ion itself.

```nsx
<div>initial count: {count}</div>
                        |
                    pass in the value
```

```tsx
<div>initial count: {$count()}</div>
                        |
                    pass in the value
```
::: info Transpiled
(simplified for demonstration purposes)
```js
jsx('div', {
  Slot: () => [$count()] // pass in the value
})
```
:::
::: info Under the hood of `jsx()`
(simplified for demonstration purposes)
```js
const textNode = document.createTextNode(value)
```
:::
<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Ion variants

### Ions with methods
```nsx
get count = ion(0, {
  increment() {
    count++
  },
  decrement() {
    count--
  }
})
```
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
```nsx
<button on:click={count@.increment}>+</button>
```
```tsx
<button on:click={$count.increment}>+</button>
```
<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Encapsulated ions
```nsx
get count = ion(0, {
  '-capsule': true, // capsule flag
  increment() {
    count++
  },
  decrement() {
    count--
  }
})

count = 5 // TypeError: Property 'value' does not exist on type '() => number'.
```
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
```nsx
<button on:click={() => count@.increment()}>+</button>
```
```tsx
<button on:click={() => $count.increment()}>+</button>
```
<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Hybrid ions

#### Mutable compound ions
```nsx
get state = ion(() => states[0], { '-mutable': true })
```
```tsx
const $state = ion(() => $states()[0], { '-mutable': true })
```

#### Derivable atomic ions
```tsx
get state = ion('Oregon', { '-derive': () => states[0] })
```
```tsx
const $state = ion('Oregon', { '-derive': () => $states()[0] })
```

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

### Async ions
See [Async Rendering](/guide/async-rendering)

## Ion hooks
```nsx
get count = ion(0, {
  '@get'() {
    console.log('count accessed!', count)
  },
  '@set'(value) {
    console.log('count set!', value)
  }
})
```
```tsx
const $count = ion(0, {
  '@get'() {
    console.log('count accessed!', this.value)
  },
  '@set'(value) {
    console.log('count set!', value)
  }
})
```

### Settable compound ions
```nsx
get first = ion('John')
get last = ion('Doe')

get fullname = ion(() => first + ' ' + last, {
  '@set'(value) {
    [first, last] = value.split(' ')
  }
})

fullname = 'Jane Doe'
```
```tsx
const $first = ion('John')
const $last = ion('Doe')

const $fullname = ion(() => $first() + ' ' + $last(), {
  '@set'(value) {
    [$first.value, $last.value] = value.split(' ')
  }
})

$fullname.value = 'Jane Doe'
```

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Debugging Ions
```nsx
get count = ion(0, {
  '@set'(value) {
    debug.traceAsync('count', value)
  }
})
```
## Debugging Ions
```tsx
const $count = ion(0, {
  '@set'(value) {
    debug.traceAsync('count', value)
  }
})
```

<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

## Tracking ions
Ions are typically [tracked by the view](#rendering-reactively). They may also be manually tracked for state changes and linked to custom reactions—functions that will run whenever the tracked state changes.

**Using `observe()`**
```nsx
observe(count@, () => {
  console.log('Count:', count)
})
```
```tsx
observe($count, () => {
  console.log('Count:', $count())
})
```
By default, reactions passed to `track` run asynchronously to the state mutation after the view has been updated. For the in-depth guide on render cycle phases, see: [The Render Cycle](/guide/the-render-cycle)

**Using an ionic task scheduler**
```nsx
ionicTick(() => {
  console.log('over the limit!', count > limit)
})
```
```tsx
ionicTick(() => {
  console.log('over the limit!', $count() > limit)
})
```
:::details CODE SWITCH
**React:** `useEffect()`

**Vue:** `observe()`, `watchEffect()`

**Svelte:** `$effect`

**Solid:** `createEffect()`

**Angular:** `effect()`
:::

### Implicit dependency tracking
Compound ions and ionic tasks are tracked through implicit dependency tracking of ionic reads (e.g. `$count()`):
```nsx
observe(() => count > limit, () => {
  console.log('over the limit!')
})
```
```tsx
observe(() => $count() > limit, () => {
  console.log('over the limit!')
})
```


<p align="right"><a href="#reactive-state" style="text-decoration: none">[top]</a></p>

