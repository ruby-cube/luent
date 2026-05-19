Getter Syntactic Sugar

#### The `get` keyword and `get` variables
The `get` keyword declares a variable with two access modes: value access and getter access (via @ operator). `get` declarations allow getters to be absorbed into variables such that when a `get` variable is read normally, it calls the getter function to access its value rather than returning the getter itself.
```tsx
let _count = 0;

get count = () => _count;

console.log(count) // value access: 0
```
```ts
// compiled
let _count = 0;

const æcount = assertæ(() => _count), count = æcount;

console.log(æcount()) // value access: 0
```

Hovering the variable `count` reveals its type information as:
```ts
[ const count@: () => number ]
```

A `get` variable must be initialized with a getter function—a function with zero parameters and returns a value.
```ts
get count = 0 // TypeError: Getter must be a function: 0
```
```ts
// compiled
const æcount = assertæ(0) // TypeError: Getter must be a function: 0
```

#### The getter accessor operator `@`
The `@` variable suffix modifies a `get` variable so that it accesses the getter function instead of the value. It is useful for reference passing across function scopes.
```tsx
console.log(count@) // getter access: () => _count
```
```tsx
// compiled
console.log(æcount) // getter access: () => _count
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
   }
}
```
```ts
interface MutableGet<T> {
   (): T
   value: T
}
```

#### `get` properties
Properties declared with the `get` keyword, like `get` variables, have two access modes.
```ts
const foo = {
   bar: 1,
   _count: 0
   get count() {
      return this._count
   }
}

console.log(foo.count) // value access: 0
console.log(foo.count@) // getter access: fn count() { return this._count }
```

Using the `@` operator on a data property will return `undefined`.
```ts
console.log(foo.bar@) // undefined
```

#### `get` properties via colon notation
In NextScript, `get` properties may also be declared through colon notation.
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

#### `get` property shorthand
```ts
  const foo@ = ref('bar')
  
  const obj = {
     get frog@,
  }
```

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
const æcount@ = ref(0) // SyntaxError: Missing initializer in const declaration
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
function foo(æbar = assertæ(0)) {
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
  bar: 1,
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

Using the `@` operator on a data property return `undefined`
```ts
const { foo@ } = obj

console.log(foo) // TypeError: foo@ is not a function
console.log(foo@) // undefined
```

`get` variables from a destructured object may be undefined and reassigned
```tsx
const { foo@ = () => 'foo' } = obj
```
```tsx
const { æfoo = assertæ(() => 'foo') } = destructureæ(obj)
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

#### Derivation shorthand `(expression)` 
Expressions surrounded by non-grouping parentheses are compiled to arrow functions.
```tsx
<button on:click={increment} disabled={(count > 100)}>+</button>
```
```tsx
// compiled
<button on:click={increment} disabled={() => æcount() > 100}>+</button>
```

#### Async derivation shorthand `(await expression)`
Expressions surrounded by non-grouping parentheses and that use `await` are compiled to async arrow functions.
```tsx
<p>
   Selection: {city@}, {(await cities@.pending, state)}
</p>
```
```tsx
// compiled
<p>
   Selection: {æcity}, {async () => await æcities.pending, æstate()}
</p>
```


### Additional Specs
#### Name collision guards
```ts
get count = () => 0
const count = 0 // SyntaxError: Identifier 'count' has already been declared
```
```tsx
const æcount = () => 0, count = æcount
const count = 0  // SyntaxError: Identifier 'count' has already been declared
```

#### Debug Mapping Policy (Source Maps + Stepping)
This section defines normative source map and stepping behavior for NextScript getter sugar transforms.

##### Goals
1. Debugging should feel source-first, not transform-first.
2. Compiler-generated helper internals are skippable by default.
3. Breakpoint binding should be stable across repeated compilations.

##### Mapping model
1. Every source expression that can execute MUST have one Primary Mapping Span.
2. Expressions with independently observable side effects MAY have additional Secondary Mapping Spans.
3. Tokens inserted only for lowering mechanics MUST be treated as synthetic and SHOULD NOT receive source mappings.
4. The first executable generated token for a mapped source span is its anchor token.

##### Token mapping rules
1. Value read sugar:
   - Source: `count`
   - Generated: `aeCount()`
   - Rule: map source `count` to generated `aeCount`; generated call parentheses are synthetic.
2. Getter access sugar:
   - Source: `count@`
   - Generated: `aeCount`
   - Rule: map source identifier `count` to generated `aeCount`; source `@` has no runtime token and MAY be represented as zero-width metadata.
3. Assignment-through-value sugar:
   - Source: `count = 2`
   - Generated: `aeCount.value = 2`
   - Rule: map `count` -> `aeCount`, `=` -> `=`, and literal `2` -> `2`; generated `.value` is synthetic unless explicitly surfaced for advanced debugging mode.
4. Derivation shorthand:
   - Source: `(count > 100)`
   - Generated: `() => aeCount() > 100`
   - Rule: map only user-authored expression tokens (`count`, `>`, `100`) and treat introduced arrow/wrapper tokens as synthetic.

##### Preferred stepping points
1. A debugger Step Over SHOULD stop on statement entry anchors.
2. A debugger SHOULD stop before side-effect boundaries:
   - call sites that can execute user code,
   - assignment writes,
   - `await` suspension points.
3. A debugger SHOULD NOT stop inside compiler helper plumbing.
4. Step Into from a sugar read SHOULD enter user getter code, not generated wrapper scaffolding.

##### Helper internals and skippable frames
1. Helper implementations MUST be emitted in dedicated helper sources or helper ranges marked as ignored.
2. Generated source maps SHOULD mark helper sources using debugger ignore-list metadata (for example, `x_google_ignoreList` where supported).
3. Helper frames SHOULD be hidden from normal stack traces and stepping by default.
4. Tooling MAY provide an opt-in mode to reveal helper internals.

##### Breakpoint binding rules
1. A breakpoint on a source line MUST bind to the earliest anchor token on that line.
2. If a source line maps only to synthetic tokens, breakpoint binding SHOULD move to the next anchor token in the same source statement.
3. If multiple anchors exist on one line, binding SHOULD prefer the leftmost token with side-effect potential.

##### Evaluation order and mapping order
When lowering introduces temporaries, generated execution order MUST preserve source evaluation order exactly, and anchor mappings MUST appear in that same order.

##### Conformance vectors
Implementations should validate this policy with at least the following vectors:

1. Step-through does not enter helper internals for:
```ts
get count = ref(0)
console.log(count)
```

2. Step Into from sugar read enters user getter body:
```ts
let v = 0
get count = () => ++v
count
```

3. Breakpoint on assignment binds to write location:
```ts
get count = ref(0)
count = 2
```

4. Derived expression steps across user tokens in source order:
```ts
get count = ref(0)
const disabled = (count > 100)
```

5. Await-based expression stops at suspension boundary only:
```ts
const value = (await task@())
```
