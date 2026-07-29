# Getter syntax

::: info NOTE
The examples below modify transpiled output with descriptive variable names for better comprehension. The actual implementation uses unique variable names to avoid name collisions.
:::

## Accessor variables

### `get` declarations
<!-- `get variable = getter` -->
<code>get <i>variable</i> = <i>getter</i></code>

Accessor variables are declared with the `get` keyword and initialized with a getter—a function that has zero parameters and returns a value. `get` declarations transpile to `const` declarations.
```nsx
let n = 0
get count = () => n

get name = 'Jim' // TypeError: Getter must be a function: 'Jim'
```
::: info transpiled
```ts
let n = 0
const count = assertGetter(() => n)

const name = assertGetter('Jim') // TypeError: Getter must be a function: 'Jim'
```
:::

::: warning IMPORTANT
Getters should avoid changing state that they read from as this breaks assumptions of referentially transparent reads, resulting in unpredictable or confusing behavior.

```nsx
get count = () => n += 10 // ❌

console.log(count) // 10
console.log(count) // 20 ⁉️
```
:::

<small>**Demo:** [Habit tracker](/demos/habit-tracker.md)</small>

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### Accessor variable reads
<!-- `variable` -->
<code><i>variable</i></code>

Similar to native accessor properties, an accessor variable will absorb its getter function at declaration such that reading the variable will call the getter rather than access it.

```nsx
get count = ref(0)
get double = () => count * 2

console.log(count instanceof Function) // false
```
::: info transpiled
```ts
const count = assertGetter(ref(0))
const double = assertGetter(() => count() * 2)

console.log(count() instanceof Function) // false
```
:::

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### Accessor variable writes
<!-- `variable = value` -->
<code><i>variable</i> = <i>value</i></code>

An accessor variable's value may be reassigned if its getter implements the `MutableGet` interface with a writable `value` property.
```nsx
get count = ref(0)

count = 2 // writes via the getter's `value` setter
```
::: info transpiled
```ts
const count = assertGetter(ref(0))

count.value = 2 // writes via the getter's `value` setter
```
:::

```tsx
interface MutableGet<T> {
  (): T
  value: T
}

function ref(state): MutableGet {
  const get = () => state
  return Object.defineProperty(get, "value", {
    get,
    set: value => state = value
  })
}
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### Accessor variable type
<!-- `variable` -->
<code><i>variable</i></code>

Hovering an accessor variable read or write will reveal it to be a `get` variable.
```nsx
get count = ref(0)

count // hover [ get count: number ]
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

## Accessor properties
### …via colon notation
<!-- `{ get property: getter }` -->
<code>{ get <i>property</i>: <i>getter</i> }</code>

In addition to native accessor property declarations, accessor properties may also be declared through colon notation.
```nsx
const foo = {
  total: 0,
  get bar: ref(true)
}
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### …via property definition
<!-- `class Obj { get property = getter }` -->
<code>class <i>Obj</i> { get <i>property</i> = <i>getter</i> }</code>

Accessor properties may also be defined through property definition in class declarations.
```nsx
class Foo {
  total = 0
  get bar = ref(true)
}
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

## Accessor operator

### ...for getter access
<!-- `variable@` | `obj.property@` -->
<code><i>variable</i>@</code>  |  <code><i>obj</i>.<i>property</i>@</code>

The getter of an accessor variable or accessor property may be accessed using the `@` postfix operator. Getter access is useful for live reference passing.
```nsx
export function MultiplierKit(count@: Get<number>) {
  return {
    doubled: () => count * 2,
    tripled: () => count * 3,
    quadrupled: () => count * 4,
  }
}
```
```nsx
import { ion } from 'luent'
import { MultiplierKit } from './MultiplierKit.ns'

function Multiplier() {
  get count = ion(0)

  const { doubled@, tripled@, quadrupled@ } = MultiplierKit(count@)

  <:>
    <p on:click={() => count++}>
      count: {count@}
    </p>
    <p>{count@} x 2 = {doubled@}</p>
    <p>{count@} x 3 = {tripled@}</p>
    <p>{count@} x 4 = {tripled@}</p>
  </:>
}
```
::: info transpiled
```ts
import { ion } from 'luent'
import { MultiplierKit } from './MultiplierKit.ns'

function Multiplier() {
  const count = assertGetter(ion(0))

  const { /* ... */ } = MultiplierKit(count)

  /* ... */
}
```
:::

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### ...for accessor function normalization
<!-- `variable@` | `obj.property@` -->
<code><i>variable</i>@</code>  |  <code><i>obj</i>.<i>property</i>@</code>

When used on a data variable/property read, the `@` operator normalizes the read to an accessor function. If the value is an accessor function, it returns that function. Otherwise, it wraps the read in an accessor function.

```nsx
function foo(bar: { count: number | Ion<number> } {
  get count = bar.count@
  /* ... */
}
```
::: info transpiled
```ts
function foo(bar: { count: number | Ion<number> } {
  const count = toAccessor(bar, 'count')
  /* ... */
}
```
:::

This applies to destructuring as well. See [`@`-postfix declarations](#postfix-declarations-in-destructuring) for more on destructuring.
```nsx
function foo(bar: { count: number | Ion<number> } {
  const { count@ } = bar;
  /* ... */
}
```


<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


## `@`-postfix declarations

### `@`-postfix parameter declarations
<!-- `variable@` -->
<code><i>variable</i>@</code>

Accessor variables may be selectively declared during parameter declarations through the `@` postfix operator.
```nsx
let count = 4
foo(() => count, true)

function foo(bar@: Get<number>, log: boolean) {
  if (log) {
    console.log(bar) // value access: 4
    console.log(bar@) // getter access: () => 4
  }
}
```
```ts
interface Get<T> {
  (): T
}
```

The default value of accessor parameter declaration must be a getter function.
```nsx
function foo(bar@ = () => 0) {
  /* ... */
}
```
::: info transpiled
```tsx
function foo(bar = assertGetter(() => 0)) {
  /* ... */
}
```
:::

Unlike accessor variables declared with the `get` keyword, accessor parameters may be `undefined` and may be reassigned.
```nsx
function foo(bar@: Get<number> | undefined) {
  if (bar@) {
    console.log(bar) // value access: 4
    console.log(bar@) // getter access: () => 4
  }
  else {
    bar@ = ref(0)
  }
}
```
<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

### `@`-postfix declarations in destructuring
<!-- `variable@` -->
<code><i>variable</i>@</code>

```ts
const { bar, count@ } = foo;
```
<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

### `get` declarations in destructuring
```nsx
const { bar, count@ } = foo;
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

### Aliasing in destructuring
```nsx
const { bar, count@: count } = foo;
const { bar, count@: num@ } = foo;
get { bar, count: num } = foo;
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


## Derivation expressions 

### Synchronous derivations
<!-- `(expression)@` | `{ statements; return statement }@` -->
<code>(<i>expression</i>)@</code>  |  <code>{ <i>statements;</i> return <i>statement</i> }@</code>

Derivation expressions are shorthand for arrow function expressions that have zero parameters and return a value. They are useful for inline derivations. They may be written as expressions with an implicit return...
```nsx
<p>{count@} x 2 = {(count * 2)@}</p>
```
::: info transpiled
```tsx
<p>{count} x 2 = {() => count() * 2}</p>
```
:::

...or as block-bodied expressions.
```nsx
<p>result: {{
  const num = getNum()
  if (num > 100) 
    return 'too ambitious'
  if (num < 0) 
    return 'too negative'
  return count * num
}@}</p>
```
::: info transpiled
```tsx
<p>result: {() => {
  const num = getNum()
  if (num > 100) 
    return 'too ambitious'
  if (num < 0) 
    return 'too negative'
  return count() * num
}}</p>
```
:::
::: info NOTE
If an accessor variable read happens only under certain conditions within a derivation expression, NextScript will hoist the call to the top of the function body. This allows getters with trackers to ...
:::

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### Immediately-invoked derivation expressions (IIDEs)
<!-- `{ statements; return expression }@()` | `(expression)@()` -->
<code>{ <i>statements;</i> return <i>expression</i> }@()</code>  |  <code>(<i>expression</i>)@()</code>

Derivation expressions may be immediately invoked. This is useful for encapsulating variables within the scope of the derivation.
```nsx
const foo = {
   let foo = 0;
   // some complex calculations
   return foo
}@()
```
::: info transpiled
```ts
const foo = (() => {
   let foo = 0;
   // some complex calculations
   return foo
})()
```
:::

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### Async derivation expressions
<!-- `(await expression)@` | `{ await expression; return expression }@` -->
<code>(await <i>expression</i>)@</code>  |  <code>{ await <i>expression</i>; return <i>expression</i> }@</code>

Expressions surrounded by non-grouping parentheses containing `await` are transpiled to async arrow functions.
```nsx
<p>
   Selection: {city@}, {(await cities@.pending, state)@}
</p>
```
::: info transpiled
```tsx
<p>
   Selection: {city}, {async () => (await cities.pending, state())}
</p>
```
:::



<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

## Type guards

Type-narrowing and -widening apply to accessor variables in the same way they apply to normal variables and accessor properties. There is no need to manually add the non-null assertion operator or store the state in a variable the way you would with accessor functions.

```ns
get user = ref(getUser())

function logName() {
   console.log(user ? user.name : 'no user. :(')
}
```

::: info COMPARE
Managing types with accessor functions:
```ts
const user = ref(getUser())

function logName() {
   console.log(user() ? user()!.name : 'no user :(')
   // or
   const u = user()
   console.log(u ? u.name : 'no user :(')
}
```
:::

::: warning CAUTION
Although an improvement over manual assertions, type narrowing/widening is not fully type-safe even for non-accessor variables and properties. If the value of a variable or property changes through a side effectful call between a type guard and a subsequent read, the inferred type may no longer reflect the actual runtime state. This behavior reflects a current design tradeoff in TypeScript's control flow analysis (see [discussion](https://github.com/microsoft/TypeScript/issues/9998)).

It is recommended to re-check mutable variables and properties after potentially side-effectful calls to avoid relying on stale type narrowings.

```ts
function logName() {
  if (!user) return;
  console.log('Username:', user.name);
  emitUserLogged();
  if (!user) return; // re-check
  console.log('After callbacks:', user.name);
}
```
:::
<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


::: tip This project is in early development.
Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable. 

We'd love help getting this project off the ground. Learn how to contribute [here](https://github.com/ruby-cube/luent/blob/main/CONTRIBUTING.md).
:::