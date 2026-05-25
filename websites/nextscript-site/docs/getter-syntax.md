# Getter syntax

## Accessor variables

### Declarations
`get variable = getter`

Accessor variables, similar to native accessor properties, absorb its getter function such that variable reads return the output of the getter rather than the getter itself. Accessor variables are declared with the `get` keyword.
```ts
get count = ion(0)
get double = ion(() => count * 2)
```

> An accessor variable must be initialized with a getter—a function with zero parameters and returns a value. Getters must never set state that it derives its return value from.

> Since accessor variable declarations are compiled to `const` declarations, the getter cannot be replaced.

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### @ postfix declarations
`variable@`

When declared through parameters or destructuring, accessor variables are selectively declared through the `@` postfix operator. Unlike optional parameters, order does not matter.
```ts
function foo(bar@, count) {
   /* ... */
}
```
```ts
const { count, bar@ } = foo;
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### Accessor variable writes
`variable = value`

The getter's value can be set if the getter implements the `MutableGet` interface with a writable `value` property.
```ts
get count = ref(0)

count = 2 // writes via the getter's `value` setter
```
```tsx
function ref(state): MutableGet {
   const get = () => state
   return Object.defineProperty(get, "value", {
      get,
      set: value => state = value
   })
}
```
```ts
interface MutableGet<T> {
   (): T
   value: T
}
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

## Accessor properties
### …via colon notation
`{ get property: getter }`

In addition to native accessor property declarations, accessor properties may also be declared through colon notation.
```ts
const foo = {
   get bar: ion(true)
}
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### …via property definition
`class Obj { get property = getter }`

Accessor properties may also be defined through property definition in class declarations.
```ts
class Foo {
   get bar = ion(true)
}
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

## The @ postfix operator 

### ...for getter access
`variable@`  |  `obj.property@`

The getter of an accessor variable or accessor property may be easily accessed using the `@` postfix operator, useful for live reference passing.
```tsx
export function MultiplierKit(count@: Get<number>) {
   return {
      doubled: () => count * 2,
      tripled: () => count * 3,
      quadrupled: () => count * 4,
   }
}
```
```ts
import { MultiplierKit } from './MultiplierKit.ns'

function Multiplier() {
   get count = ion(0)

   const { doubled@, tripled@, quadrupled@ } = MultiplierKit(count@)

   <:component>
      <p on:click={() => count++}>
         count: {count@}
      </p>
      <p>{count@} x 2 = {doubled@}</p>
      <p>{count@} x 3 = {tripled@}</p>
      <p>{count@} x 4 = {tripled@}</p>
   </:component>
}
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### ...for getter normalization
`variable@`  |  `obj.property@`

When used on a data variable/property read, the `@` operator will wrap the read in a getter. This applies to destructuring as well.
```ts
function foo(bar: { count: number | Ion<number> } {
   get count = bar.count@
   // alternatively: const { count@ } = bar;
}
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

## Derivation expressions 

### Synchronous derivations
`(expression)@`  |  `{ statements; return statement }@`

Derivation expressions are shorthand's for getter/derivation functions, useful for in-template derivations. They may be written with parentheses for implicit returns or with curly braces for block-bodied expressions.
```tsx
<p>doubled: {(count * 2)@}</p>
<p>doubled: {() => count * 2}</p>
```
```tsx
<p>result: {{
   const num = getNum()
   if (num > 100) 
      return 'too ambitious'
   if (num < 0) 
      return 'too negative'
   return count * num
}@}</p>
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### Immediately-invoked derivation expressions (IIDEs)
`{ statements; return expression }@()`  |  `(expression)@()`

Derivation expressions may be immediately invoked, useful for encapsulating variables within the scope of the derivation.
```ts
const foo = {
   let foo = 0;
   // some complex calculations
   return foo
}@()
```

<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>


### Async derivation expressions
`(await expression)@`  |  `{ await expression; return expression }@`

Expressions surrounded by non-grouping parentheses and which use `await` are compiled to async arrow functions.
```tsx
<p>
   Selection: {city@}, {(await cities@.pending, state)@}
</p>
```
```tsx
// compiled
<p>
   Selection: {city}, {async () => (await cities.pending, state())}
</p>
```



<p align="right"><a href="#getter-syntax" style="text-decoration: none">[top]</a></p>

## Type guards

Type-narrowing and -widening apply to accessor variables in the same way they apply to normal variables and accessor properties. There is no need to manually add the non-null assertion operator or store the state in a variable the way you would with getter functions.

```ts
get user = ion<User | undefined>(undefined)

function logName() {
   console.log(user ? user.name : 'no user. :(')
}
```

Compare: managing types with getter functions:
```ts
const user = ion<User | undefined>(undefined)

function logName() {
   console.log(user() ? user()!.name : 'no user :(')
   // or
   const u = user()
   console.log(u ? u.name : 'no user :(')
}
```

> **Caution**: Although an improvement to manual assertions, be aware that type-narrowing and type-widening is not 100% type-safe. This is true even for native variables and accessor properties. Type-narrowing and type-widening reflect only what the TypeScript compiler can deduce from static analysis. If the state of a variable or property is modified covertly via a function call between the type guard and the read, the type will not reflect new state. 

