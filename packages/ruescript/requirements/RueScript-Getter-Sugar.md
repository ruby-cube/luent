# RueScript: Getter Sugar
#luent

### Getter Syntactic Sugar

#### The `get` keyword and `get` variables
The `get` keyword declares a variable with two access modes: value access and getter access (via @ operator). `get` declarations allow getters to be absorbed into variables such that when a `get` variable is read, it calls the getter function to access its value rather than returning the getter itself.
```tsx
let _count = 0;

get count = () => _count;

console.log(count) // value access: 0
```
```ts
// compiled
let _count = 0;

const count = assertª(() => _count);

console.log(count()) // value access: 0
```

Hovering the variable `count` reveals its type information as:
```ts
[ get count: number ]
```

A `get` variable must be initialized with a getter function—a function with zero parameters and returns a value.
```ts
get count = 0 // TypeError: Getter must be a function: 0
```
```ts
// compiled
const count = assertª(0) // TypeError: Getter must be a function: 0
```

> **Limitation:** Symbols may not be used as keys for `get` variables.

#### The getter accessor operator `@`
The `@` variable suffix modifies a `get` variable so that it accesses the getter function instead of the value. It is useful for reference passing across function scopes.
```tsx
console.log(count@) // getter access: () => _count
```
```tsx
// compiled
console.log(count) // getter access: () => _count
```

If used on a non-`get` variable, the accessor operator will wrap the variable in a getter.

```tsx
const count = 0;

const start = count@

console.log(start) // () => count

```
```tsx
const count = 0;

const start = () => count

console.log(start) // () => count

```

#### `get` variable reassignment
While `get` variables cannot be reassigned with a different getter, the getter's value can be reassigned if the getter implements the `MutableGet` interface with a writable `value` property.
```ts
get count = ref(0)

count@ = ref(0) // X TypeError: Assignment to constant variable.
count = 2 // count is reassigned to 2
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
` compiled `
```ts
const count = ref(0)

count = ref(0) // X TypeError: Assignment to constant variable.
assertµ(count).value = 2 // count is reassigned to 2
```

If a `get` variable with no `value` setter is assigned a value, we get a type error
```ts
let _foo = 0;

get foo = () => _foo

foo = 2 // X TypeError: Cannot set value of `get` variable that does not have a setter.
```

#### `get` properties
Properties declared with the `get` keyword, like `get` variables, have two access modes.
```ts
const foo = {
   bar: 1,
   _count: 0,
   get count() {
      return this._count
   }
}

console.log(foo.count) // value access: 0
console.log(foo.count@) // getter access: fn count() { return this._count }
```

```ts
const foo = {
   bar: 1,
   _count: 0,
   get count() {
      return this._count
   }
}

console.log(foo.count) // value access: 0
console.log(getª(foo).count) // getter access: fn count() { return this._count }
```

Using the `@` operator on a data property will return `undefined`.
```ts
console.log(foo.bar@) // undefined
```

> **Limitations:** 
> - Symbols may not be used as keys for `get` properties.
> - `@` operator may not be used with bracket notation.

#### The `this` keyword and accessed getters
Using the `@` operator on an object property is essentially shorthand for accessing an accessor property’s getter through native `Object.getOwnPropertyDescriptor(obj, key).get`. As with native JavaScript, a property getter accessed through the `@` operator will lose reference to its `this` object. This behavior allows for more flexibility at the primitive level. If preserving `this` is required, pass the property using derivation shorthand or a native arrow function.
```ts
const foo = {
   _count: 0,
   get count() {
      return this._count
   }
}

function logCount(count@) {
   console.log(count)
}

logCount(foo.count@) // TypeError: Cannot read properties of undefined (reading '_count')
logCount((foo.count)) // 0
logCount(() => foo.count) // 0
```

Note that in Luent, ionic proxies will return a bound getter, allowing for more stability.
```ts
const foo = ionic({
   _count: 0,
   get count() {
      return this._count
   }
})

logCount(foo.count@) // 0
```

#### `get` properties via colon notation
In RueScript, `get` properties may also be declared through colon notation.
```tsx
const foo = {
   get count: ref(0)
}
```
```ts
const count@ = ref(0)

const foo = {
   get count: count@
}
```
`compile-time`
```ts
const foo = absorbª({
   get count() { return ªvalue(ref(0)) }
})
```
`runtime`
```ts
const foo = absorbª({
   geªcount: ref(0)
})
```


> **Limitation:** `get` property keys using colon notation may not be computed, quoted, or symbol keys

#### Declarations with `@` operator
`let`, `var`, `const`, and property declarations with the `@` operator will not result in getter absorption. The declared variable will only have getter access mode. The getter must be called to access its value.
```ts
const count@ = ref(0)

console.log(count) // ReferenceError: count is not defined
console.log(count@) // getter access: () => state
console.log(count@()) // value access: 0
```
```ts
const foo = {
   count@: ref(0)
}
console.log(foo.count) // undefined
console.log(foo.count@) // getter access: () => state
console.log(foo.count@()) // property access: 0
```
```ts
get count = ref(0)

const foo = {
   count@
}
console.log(foo.count) // undefined
console.log(foo.count@) // getter access: () => state
console.log(foo.count@()) // property access: 0
```

Declarations with both `get` keyword and `@` operator are invalid syntax. Applies to property declarations, destructuring, and binding list.
```ts
get count@ = ref(0) // SyntaxError: Missing initializer in const declaration
```
```ts
const count@ = ref(0) // SyntaxError: Missing initializer in const declaration
```

#### `get` parameter declarations via `@` operator
In general, the `@` operator cannot be used to declare `get` variables with dual access modes. However, for parameter declarations, the `@` operator is used in place of the `get` keyword to declare `get` variables.
```tsx
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

The default value of `get` parameter declaration must be a getter.
```tsx
function foo(bar@ = () => 0) {
}
```
```tsx
function foo(bar = assertª(() => 0)) {
}
```

Unlike `get` variables declared with the `get` keyword, `get` parameters may be `undefined` and may be reassigned.
```tsx
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

#### `get` variables via `@` operator in destructuring
As with parameter declarations, the `@` operator is used in place of the `get` keyword in destructuring to selectively declare `get` variables.
```ts
const obj = {
  foo: 0,
  bar: { foo: 2 },
  get count: ref(4)
}

const { foo, bar, count@ } = obj
console.log(count) // value access: 4
console.log(count@) // getter access: () => state
```

Note declaring both the getter property and value property will result in a syntax error.
```ts
const { count@, count } = obj // SyntaxError: Identifier 'count' has already been declared
```

Using the `@` operator on a data property returns `undefined`
```ts
const { foo@ } = obj

console.log(foo) // TypeError: foo@ is not a function
console.log(foo@) // undefined
```

`get` variables from a destructured object may be undefined and reassigned
```tsx
const { foo@ = () => 2 } = obj
```
```tsx
const { foo = assertª(() => 2) } = destructureªª(obj)
```

#### Nested destructuring
```ts
const { bar: { foo@ } } = obj
```
```ts
const { bar: { foo } } = destructureªª(obj, { bar: obj.bar }, 'foo')
```

#### Aliasing with `@` operator when destructuring 
```ts
const { count@: c@ } = obj
```

#### Destructuring with `get` keyword
When an object is destructured with the `get` keyword, all property values are normalized to getter functions—the getter of accessor properties will be assigned to the `get` variable while the value of data properties will be wrapped in a getter function.
```ts
const obj = {
  foo: 0,
  bar: 1,
  get count: ref(4)
}

get { foo, bar, count } = obj
console.log(bar) // value access: 1
console.log(bar@) // getter access: () => value
```

> Limitations: Nested destructuring is disallowed when destructuring with `get`

#### Getter shorthand `(expression)@` `{ statement; return expression; }@`
Expressions surrounded by non-grouping parentheses are compiled to arrow functions.
```tsx
<button on:click={increment} disabled={(count > 100)@}>+</button>
```
```tsx
// compiled
<button on:click={increment} disabled={() => count() > 100}>+</button>
```

with sequence expressions
```tsx
(c, a + b)@
```
```tsx
() => (c, a + b)
```

#### IIFE shorthand `(expression)@()` `{ statement; return expression; }@()`
```tsx
(a + b)@()
```
```tsx
(() => a + b)()
```

```tsx
{ const a = foo; const b = bar; return a + b }@()
```
```tsx
(() => { const a = foo; const b = bar; return a + b })()
```


#### Async derivation shorthand `(await expression)`
Expressions surrounded by non-grouping parentheses and that use `await` are compiled to async arrow functions.
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


### Additional Specs

#### Type guards
+ Typescript should call out when the value of an `get` variable is possibly undefined when accessing via the transformed `variable()` and add a `!` after synchronous reads that are proven guarded.
+ Supported synchronous guard forms for `!` emission include:
  - `if (obj) { ...obj.name... }`
  - `if (!obj) { ... } else { ...obj.name... }`
  + `if (!obj) return; obj.name`
  - `obj && obj.name`
  - `obj ? obj.name : fallback`
  - `!obj ? fallback : obj.name`
  - loop-guarded bodies:
    - `while (obj) { ...obj.name... }`
    - `do { ...obj.name... } while (obj)`
    - `for (; obj; ) { ...obj.name... }`
  - nested conditionals where the active branch implies `obj` is truthy
  - explicit nullish comparisons:
    - truthy branch of `obj != null`, `obj !== undefined`, `obj !== null`
    - false/else branch of `obj == null`, `obj === undefined`, `obj === null`
  - template conditional helpers in JSX templates:
    - `If(condition, branch)` / `ElseIf(condition, branch)` guarded branches
    - `Else(branch)` when prior `If`/`ElseIf` conditions imply truthiness in the else path (e.g. `If(!obj, ...)` + `Else(...)`)
    - render-function branch scopes are treated as synchronous guarded scopes when the branch condition implies truthiness:
      - `If(condition, () => ...)`, `ElseIf(condition, () => ...)`, `Else(() => ...)`
      - `IfElse(condition, whenTrue, whenFalse)` for `whenTrue` scope
+ Synchronous guard assertions do **not** flow into nested function/callback bodies (e.g. `watch(..., () => obj.name)`), so TypeScript can still report possible-undefined reads there.


#### Getter access operator toggle for component setup
```tsx
function Compo(setup) {
   const { a, b@ } = setup
   <Component>
   </Component>
}
```
```tsx
function Compo(setup) {
   const { a, b } = setup[Wª]

   <Component>
   </Component>
}
```

Destructured parameter with `@` operator
```tsx
function Compo({ a, b@ }) {
   
   <Component>
   </Component>
}
```
```tsx
function Compo(setup) {
   const { a, b } = setup[Wª]

   <Component>
   </Component>
}
```