# NextScript: Getter Sugar
#luent

### Getter Syntactic Sugar

#### @ symbol
The @ symbol has three different roles in NextScript:
- as accessor operator (to return getters; also normalizes values to getters)
  - only operates on values, not expressions
  - must directly suffix the value read—no grouping parentheses or whitespace may separate the operator from the read.
- as part of derivation expression syntax `(expression)@`  and `{ statement; return expression }@`
- as accessor absorption operator (to declare accessor variables when `get` keyword cannot be used)
  - only for parameter declaration and destructuring

#### The `get` keyword and accessor variables
The `get` keyword binds a variable to a getter that will be called whenever the variable is read. This binding behavior is referred to as getter absorption.
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


#### The accessor operator `@`
The `@` access operator modifies value reads such that it accesses its getter instead of the value. It is useful for reference passing across function scopes.
```tsx
let _count = 0;
get count = () => _count;

count@ // () => number
count // number
console.log(count@) // () => _count
```

If used on a data variable value or return value, the accessor operator will normalize the value to a getter. That is to say, if the value is not a getter, it will wrap the value in a getter. If the value is already a getter, it will return the getter.
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

The `@` operator may only suffix variable/property during value reads, not variables at declaration. Using it in pure declarations or anywhere else will result in a syntax error. Note: Parameter declarations, destructuring, and property shorthands are considered by NextScript as simultaneous reads and declarations. The @ operator may be used in these cases.
```ts
const count@ = 0 // SyntaxError: Missing initializer in const declaration
```

#### Writing via accessor variable
While accessor variables cannot be reassigned with a different getter, the getter's *value* can be set if the getter implements the `MutableGet` interface with a writable `value` property.
```ts
get count = ref(0)

count@ = ref(0) // X SyntaxError: Invalid or unexpected token
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
` compiled `
```ts
const count = ref(0)

count = ref(0) // X TypeError: Assignment to constant variable.
assertµ(count).value = 2 // writes via the getter's `value` setter
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
In NextScript, accessor properties may also be declared through colon notation.
```tsx
const foo = {
   get count: ref(0)
}
```

`compiled compile-time for tsc and language services`
```ts
const foo = absorbª({
   get count() { return ªvalue(ref(0)) }
})
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

Using the `@` operator on a data property normalizes the value to a getter.
```ts
const { foo@ } = obj

console.log(foo) // 0
console.log(foo@) // () => obj.foo
```


Accessor variables from a destructured object may be undefined and reassigned
```tsx
const { foo@ = () => 2 } = obj
```
```tsx
const { foo = assertª(() => 2) } = destructureªª(obj, 'foo')
```

#### Nested destructuring
// TODO‼️
```ts
const { bar: { foo@ } } = obj
```
```ts
const { bar: { foo } } = destructureªª(obj, { bar: obj.bar })
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

#### Derivation expression `(expression)@` `{ statement; return expression; }@`
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

#### IIDE immediately invoked derivation expression `(expression)@()` `{ statement; return expression; }@()`
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


#### Async derivation expression `(await expression)@`
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


#### The accessor operator with return values
```ts
foo()@

foo()@ as Get<number>

(foo()@) as Get<number>
```

Note, if parentheses are used, it becomes a derivation expression:
```ts
(foo() as number)@
-->
() => foo() as number
```

#### The accessor operator with class instantiation
```ts
const getFoo = new Foo()@ // Get<Foo>

```

Note, if parentheses are used, it becomes a derivation expression:
```ts
(new Foo())@
-->
() => new Foo()
```

#### Additional cases with @ accessor operator:
---
parameter declaration with **maybe getter type**:
```ts
function doSomething(count: number | Get<number>) {
	const getCount = count@; // Get<number>
}
```
`compiled output`
```ts
function doSomething(count: number | Get<number>) {
	const getCount = toª(count); // Get<number>
}
```
---
parameter declaration with **@ operator** and maybe getter type:
```ts
function doSomething(count@: number | Get<number>) {
   count@ // Get<number>
   count // number
}
```
`compiled output`
```ts
function doSomething(count: number | Get<number>) {
    count = toª(count) // absorption
	count  // Get<number>
    count() // number
}
```
---

**optional** parameter declaration with getter type
**optional** parameter declaration with maybe getter type
```ts
function doSomething(count?: number | Get<number>) {
    count@ // Get<number | undefined> | Get<number>
	count?.@ // undefined | Get<number>
    count!@ // Get<number>
    count // undefined | number | Get<number>
}
```
`compiled output`
```ts
function doSomething(count?: number | Get<number>) {
    toª(count)
	count ? toª(count) : undefined // undefined | Get<number>
    toª(assertNonNull(count)) // Get<number>
    count // undefined | number | Get<number>
}
```
---
**optional** parameter declaration with **@ operator** and maybe getter type:
```ts
function doSomething(count@?: number | Get<number>) {
	count@ // undefined | Get<number>
    count // number | never (throws)
    count! // number (throws at runtime if undefined)
    count?; // number | undefined
    console.log(count?)
    console.log((count?) ?? 0)
}
```
`compiled`
```ts
function doSomething(count?: number | Get<number>) {
	count = count ? toª(count) : undefined // absorption
	count // undefined | Get<number>
    count()  // number | never (throws)
    count!() // number (throws at runtime if undefined)
    count?.(); // number | undefined
    console.log(count?.())
    console.log(count?.() ?? 0)
}
```

---
parameter declaration with **invalid default** with **@ operator** and maybe getter type:
```ts
function doSomething(count@: number | Get<number> = 0) { // TypeError
}
```
`compiled`
```ts
function doSomething(count: number | Get<number> = assertGetter(0)) {
   count = toª(count) // absorption
}
```
---
parameter declaration with **valid default** with **@ operator** and maybe getter type:
```ts
function doSomething(count@: number | Get<number> = assertGetter(() => 0)) {
	count@ // Get<number>
    count // number
}
```
`compiled`
```ts
function doSomething(count: number | Get<number> = assertGetter(() => 0)) {
    count = toª(count)
    count // Get<number>
    count() // number
}
```

---
destructuring with **maybe getter**
```ts
type Obj = { count: number | Get<number }

function doSomething(obj: Obj) {
   const { count@ } = obj
   count@ // Get<number>
   count // number
}
```

destructuring with **optional property**
```ts
type Obj = { count?: number | Get<number> }

function doSomething(obj: Obj) {
   const { count@ } = obj
   count@ // undefined | Get<number>
   count // number | never (throws)
   count! // number (will throw if undefined at runtime)
   count?; // number | undefined
   (count?) // number | undefined
}
```

destructuring with **invalid default**
```ts
type Obj = { count?: number | Get<number> }

function doSomething(obj: Obj) {
   const { count@ = 0 } = obj // TypeError
}
```

destructuring with **valid default**
```ts
type Obj = { count?: number | Get<number> }

function doSomething(obj: Obj) {
   const { count@ = () => 0 } = obj
   count@ // Get<number>
   count // number
}
```

### Additional Specs

#### Type guards
+ `!` emission mirrors TypeScript's own control-flow narrowing of native accessor properties: in any synchronous context where TypeScript would narrow a `get` property read and no longer flag it as possibly-undefined, the language service emits `!` after the compiled `variable()` call.
+ For JSX template conditional helpers (`If`, `ElseIf`, `Else`, `IfElse`), which TypeScript does not natively recognize as control-flow constructs, the language service maps them to their equivalent imperative forms before applying the same narrowing rules.
+ Synchronous guard assertions do **not** flow into nested function/callback bodies (e.g. `watch(..., () => obj.name)`), consistent with how TypeScript handles narrowing of native accessor properties.
