

## Getter syntactic sugar

### Accessor variables
`get variable = getter`

Accessor variables, similar to native accessor properties, absorb its getter function such that variable reads return the output of the getter rather than the getter itself. Accessor variables are declared with the `get` keyword.
```ts
get count = ion(0)
get double = ion(() => count * 2)
```

> An accessor variable must be initialized with a getter—a function with zero parameters and returns a value. Getters must never set state that it derives its return value from.

> Since accessor variable declarations are compiled to `const` declarations, the getter cannot be replaced.

#### Implicit declaration contexts
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

#### Accessor variable writes
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

### Accessor Properties
#### …via colon notation
`{ get property: getter }`

In addition to native accessor property declarations, accessor properties may also be declared through colon notation.
```ts
const foo = {
   get bar: ion(true)
}
```

#### …via property definition
`class Obj { get property = getter }`
Accessor properties may also be defined through property definition in class declarations.
```ts
class Foo {
   get bar = ion(true)
}
```

### The getter access operator 
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

#### Getter normalization
`variable@`  |  `obj.property@`
When used on a data variable/property read, the `@` operator will wrap the read in a getter. This applies to destructuring as well.
```ts
function foo(bar: { count: number | Ion<number> } {
   get count = bar.count@
   // alternatively: const { count@ } = bar;
}
```

### Derivation expressions 
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

#### IIDEs
`{ statements; return expression }@()`  |  `(expression)@()`
Derivation expressions may be immediately invoked, useful for encapsulating variables within the scope of the derivation.
```ts
const foo = {
   let foo = 0;
   // some complex calculations
   return foo
}@()
```

#### Async derivation expressions
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


## JSX Terminology

### JSX Factory `() => <jsx/>`
A JSX factory is any function that returns a JSX element or fragment.
```tsx
const renderRow = () => <tr><td>Hello</td></tr>
```

### JSX Call Expression `{callee()}`
A JSX call expression is a call expression directly embedded in a JSX expression container.
```tsx
<div>{foo(bar)}</div>
```

## JSX Syntactic Sugar

### JSX Gateway Return `<//>`
The JSX gateway return syntax, `<//>`, signifies a switch from JavaScript to JSX, which extends to the end of the containing JavaScript block or expression position. It returns the JSX as a fragment. A JSX gateway is only valid in a statement position or as the arrow of a JSX gateway function expression.

source:
```tsx
function Something() {
   const foo = getSomething();
   <//>
   <p>{foo}</p>
   <p>{foo}</p>
}
```
compiled:
```tsx
function Something() {
   const foo = getSomething();
   return <>
      <p>{foo}</p>
      <p>{foo}</p>
   </>;
}
```

source:
```tsx
function Something() {
   const foo = getSomething();
   if (foo) {
      <//>
      <p>{foo}</p>
   }
   <//>
   <p>Nothing :(</p>
}
```
compiled:
```tsx
function Something() {
   const foo = getSomething();
   if (foo) {
      return <><p>{foo}</p></>
   }
   return <><p>Nothing :(</p></>
}
```


### JSX flow expression
A JSX flow expression is a JSX call expression where the callee is a pascale-cased function and the final argument is a JSX entity or factory:
- JSX fragment
- JSX element
- JSX children
- JSX gateway function expression
- JSX factory

The final argument is normalized to a JSX fragment factory at compile time.

source:
```tsx
<div>
   {If(active, 
      <p>{foo}</p>
   )}
</div>
```
compiled:
```tsx
<div>
   {If(active, () =>
      <><p>{foo}</p></>
   )}
</div>
```

source:
```tsx
<div>
   {If(active, 
      <p>{foo}</p>
      <p>{foo}</p>
   )}
</div>
```
compiled:
```tsx
<div>
   {If(active, () =>
      <>
         <p>{foo}</p>
         <p>{foo}</p>
      </>
   )}
</div>
```

source:
```tsx
<div>
   {If(active, <>
      <p>{foo}</p>
      <p>{foo}</p>
   </>)}
</div>
```
compiled:
```tsx
<div>
   {If(active, () =>
      <><>
         <p>{foo}</p>
         <p>{foo}</p>
      </></>
   )}
</div>
```

### JSX gateway function expressions
A JSX gateway function expression is shorthand for an arrow function that returns a JSX fragment. It may only appear as the final argument of a JSX flow expression. Parameter parentheses may only be omitted if there are no parameters. 

source:
```tsx
<div>
   {If(active, <//>
      Hello world
   )}
</div>
```
compiled:
```tsx
<div>
   {If(active, () =>
      <>Hello world</>
   )}
</div>
```

source:
```tsx
<div>
   {If(active, <//>
      {If(open,
         <p>Hello world</p>
      )}
   )}
</div>
```
compiled:
```tsx
<div>
   {If(active, () => 
      <>
      {If(open,
         <p>Hello world</p>
      )}
      </>
   )}
</div>
```

source:
```tsx
<div>
   {If(active, (o) <//>
      Hello world
   )}
</div>
```
compiled:
```tsx
<div>
   {If(active, (o) =>
      <>
         Hello world
      </>
   )}
</div>
```

source:
```tsx
<div>
   {If(active, (o) <//>
      {If(open,
         <p>Hello world</p>
      )}
   )}
</div>
```
compiled
```tsx
<div>
   {If(active, (o) =>
      <>
         {If(open,
            <p>Hello world</p>
         )}
      </>
   )}
</div>
```

source:
```tsx
<div>
   {If(active, (o, p) <//>
      Hello world
   )}
</div>
```
compiled:
```tsx
<div>
   {If(active, (o, p) =>
      <>
         Hello world
      </>
   )}
</div>
```

```tsx
// X invalid: not the final argument of a JSX flow expression
const renderSomething = x <//>
   {If(open,
      <p>Hello world</p>
   )}
   <div>other</div>;
```

### JSX keyword element
`<*keyword><*keyword>`
A JSX keyword element is a reserved symbol-prefixed language element registered by the transpiler. Components and native elements may not serve as keyword elements. Any unknown, unregistered keyword elements result in compile-time errors. Currently, there is only one keyword element (the component element) and only one reserved symbol-prefix (the colon prefix for auto-returns).

### JSX return element
`<:keyword></:keyword>`
A JSX return element is a colon-prefixed keyword element that returns its keyword element. All following sibling statements are unreachable.

### JSX component element
`<:component as={component}></:component>`
The JSX component element is an auto-returned JSX keyword element that allows refs of component instances to be typed. The default implementation of JSXComponent simply returns a ComponentKit, a plain object containing the component instance and nodes.

```ts
type JSXComponent = <T>(setup: { as?: T, Slot: NSXNode | NSXNode[] }) => ComponentKit<T>

interface ComponentKit<T> {
   component: T
   nodes: NSXNode[];
}
```
```ts
get dialog = NodeRef(Dialog)

<button on:click={() => dialog?.open()}>submit</button>
<Dialog ref={dialog}>
   <DialogContent close={() => dialog?.close()}/>
</Dialog>
```
```ts
function Dialog({ Slot }) {
   get opened = ion(false)
   const open = () => { opened = true }
   const close = () => { opened = false }

   <:component as={{ open, close }}>  
      {If(opened, 
         <o--body>
            <div>{Slot()}</div>
         </o--body>
      )}
   </:component>
}
```
compiled:
```tsx
function Dialog({ Slot }) {
   get opened = ion(false)
   const open = () => { opened = true }
   const close = () => { opened = false }

   return JSXComponent({
      Slot: <>
         {If(opened, 
            <o--body>
               <div>{Slot()}</div>
            </o--body>
         )}
      </>,
      as: { open, close }
   }) 
}
```