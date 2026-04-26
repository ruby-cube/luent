# RueScript: Getter Sugar
#luent

### Getter Syntactic Sugar

#### The `get` keyword and accessor variables
The `get` keyword binds a variable to a getter that will be called when that variable is read. This behavior will be referred to as getter absorption.
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

An accessor variable must be initialized with a getter function—a function with zero parameters and returns a value.
```ts
get count = 0 // TypeError: Getter must be a function: 0
```
```ts
// compiled
const count = assertª(0) // TypeError: Getter must be a function: 0
```


#### The getter accessor operator `@`
The `@` read operator modifies a variable/property read such that it accesses a getter instead of the value. It is useful for reference passing across function scopes.
```tsx
console.log(count@) // getter access: () => _count
```
```tsx
// compiled
console.log(count) // getter access: () => _count
```

If used on a data variable, the accessor operator will normalize the value to a getter. If the value is not a getter, it will wrap the value in a getter. If the value is already a getter, it will return the getter.
```tsx
let count = 0;
const getCount = count@

console.log(getCount) // () => count
```
```ts
const count = () => _count;
const getCount = count@

console.log(getCount) // () => count
```

The `@` operator may only follow variable/property reads, not declarations. Using it in declarations or anywhere else will result in a syntax error
```ts
const count@ = 0 // SyntaxError: Missing initializer in const declaration
run()@ // SyntaxError: Invalid or unexpected token
```

#### Accessor variable reassignment
Assignment expressions on accessor variables are setter-routing sugar, not variable rebinding. The binding itself remains fixed (compiled as a `const`), and `count = value` writes through to the getter's `value` setter when available.

Accessor variables therefore cannot be rebound to a different getter. If no writable `value` setter exists, assigning a value is a type error.
```ts
get count = ref(0)

count@ = ref(0) // X SyntaxError: Invalid or unexpected token
count = 2 // writes through the getter's `value` setter
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
assertµ(count).value = 2 // writes through the getter's `value` setter
```

If an accessor variable with no `value` setter is assigned a value, we get a type error
```ts
let _foo = 0;

get foo = () => _foo

foo = 2 // X TypeError: Cannot set value of accessor variable that does not have a setter.
```

#### Accessor properties

```ts
const foo = {
   bar: 1,
   _count: 0,
   get count() {
      return this._count
   }
}

console.log(foo.count) // value access: 0
console.log(foo.count@) // getter access: () => obj[key]
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
console.log(getª(foo).count) // getter access: () => obj[key]
```

Note that unlike for accessor variables, the @ operator will return a wrapper getter function instead of the initialization function for accessor properties in order to preserve `this` binding.

Using the `@` operator on a data property will wrap it in a getter.
```ts
console.log(foo.bar@) // () => foo.bar
```

Bracket notation
```ts
const key = 'bar'

console.log(foo[key]@)
```
`compiled`
```ts
const key = 'bar'

console.log(getª(foo)[key])
```

#### Accessor properties via colon notation
In RueScript, accessor properties may also be declared through colon notation.
```tsx
const foo = {
   get count: ref(0)
}
```

`compiled compile-time for tsc and language services`
```ts
const foo = {
   get count() { return ªvalue(ref(0)) }
}
```
`compiled runtime for browser`
```ts
const foo = absorbª({
   count: asAbsorbedª(ref(0))
})
```

#### Accessor parameter declarations via `@` operator
In general, the `@` operator cannot be used to declare accessor variables with dual access modes. However, for parameter declarations, the `@` operator is used in place of the `get` keyword to declare accessor variables.
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

The default value of accessor parameter declaration must be a getter.
```tsx
function foo(bar@ = () => 0) {
}
```
```tsx
function foo(bar = assertª(() => 0)) {
}
```

Unlike accessor variables declared with the `get` keyword, accessor parameters may be `undefined` and may be reassigned.
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

#### Accessor variables via `@` operator in destructuring
As with parameter declarations, the `@` operator is used in place of the `get` keyword in destructuring to selectively declare accessor variables.
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

Note declaring both an accessor variable and a data variable with the same name will result in a syntax error.
```ts
const { count@, count } = obj // SyntaxError: Identifier 'count' has already been declared
```

Using the `@` operator on a data property returns `undefined`
```ts
const { foo@ } = obj

console.log(foo) // TypeError: foo@ is not a function
console.log(foo@) // undefined
```

Accessor variables from a destructured object may be undefined and reassigned
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
When an object is destructured with the `get` keyword, all property values are normalized to getter functions—the getter of accessor properties will be assigned to the accessor variable while the value of data properties will be wrapped in a getter function.
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


#### Async derivation shorthand `(await expression)@`
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
+ TypeScript should call out when the value of an accessor variable is possibly undefined when accessing via the transformed `variable()` and add a `!` after synchronous reads that are proven guarded.
+ `!` emission mirrors TypeScript's own control-flow narrowing of native accessor properties: in any synchronous context where TypeScript would narrow a `get` property read and no longer flag it as possibly-undefined, the language service emits `!` after the compiled `variable()` call.
+ For JSX template conditional helpers (`If`, `ElseIf`, `Else`, `IfElse`), which TypeScript does not natively recognize as control-flow constructs, the language service maps them to their equivalent imperative forms before applying the same narrowing rules.
+ Synchronous guard assertions do **not** flow into nested function/callback bodies (e.g. `watch(..., () => obj.name)`), consistent with how TypeScript handles narrowing of native accessor properties.


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