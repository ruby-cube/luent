<div align="center">
<picture>
  <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/packages/nextscript/assets/nextscript-logo-padded.png" alt="luent-logo"/>
</picture>
</div>

# NextScript

NextScript is an experimental language extension of TypeScript + JSX designed to improve the readability, ergonomics, and type-safety of modern reactive application code.

> This project is in early development. Most features have been specified and partially implemented, but substantial tooling work remains before the extension is fully usable. See how to contribute here.


<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation

Reactive UI programming and JSX have both been game changers in web development, turning complex UI updates into simple data bindings. However, JavaScript variables are not natively reactive, and existing solutions to making them reactive have their caveats. What may seem simple and elegant at first glance often creates downstream complexity, conceptual overhead, and/or performance issues through implicit behaviors that do not always align with native JavaScript semantics or patterns.

Meanwhile, getter functions, popularized in the form of signals by Solid.js, show real promise as an explicit, performant conduit to reactivity in JavaScript. Unfortunately, getters have their own set of caveats, such as not playing well with TypeScript type guards, impacting readability due to the visual clutter of functions and function calls, or the confusion caused by functions cloaked in data variable naming.

On the templating side, JSX, though elegant in its syntactic rules, can quickly become unwieldy and difficult to read when indentation from fragments and nesting cumulate into indentation hell.

NextScript proposes to address these caveats through a dash of syntactic sugar.


<p align="right"><a href="#readme-top">[top]</a></p>

## Design Principles

**Coherence and predictability.** 
As a language extension, NextScript must remain coherent with its foundational languages and preserve predictable semantics.

**Principled magic, not spookiness.**
NextScript introduces new syntax and semantics carefully, opting for explicitness whenever possible. It introduces implicit semantics only if behavior is locally deducible and provides enough ergonomic benefit to justify its addition to the language. The goal is not to avoid magic altogether, but to avoid *unaccountable* magic: behavior that feels arbitrary, exceptional, or difficult to reason about.


<p align="right"><a href="#readme-top">[top]</a></p>

## Features
> For examples and details, see NextScript at a glance
### Readability
- **accessor variables** as scope-level counterparts to native accessor properties
- **derivation expressions** for improved readability of inline derivations
- **JSX flow expressions** for intuitive control flow

### Ergonomics
- **accessor postfix operator** to facilitate live reference passing
- **accessor property colon notation** for ergonomic accessor property declarations
- **JSX gateway syntax** to ergomically embed JSX in JavaScript
- **JSX attribute shorthand** to reduce redundancy

### Type-safety
- **type-guarding of accessor variables** for improved type-safety
- **JSX component element** for type-safe component refs

### Planned features:
- **async sequence statements** for improved readability of async sequences 
- **class property access modifiers** to ergonomically manage complex access rights

> **Note:** Though primarily designed to accommodate getter-based reactivity, NextScript accessor variables and the accessor postfix operator have no inherent reactivity. They are equally useful for simple live reference passing of “inert” getters. Refs, for example.


<p align="right"><a href="#readme-top">[top]</a></p>

## Code comparison
> **Note:** While the examples below feature API from Luent for demonstration purposes, NextScript may be used independently of Luent.

TODO: JSX transpilation note

### Code readability
#### with NextScript (.nsx)
```tsx
function Counter({ limit }) {

   get count = ion(0, {
      increment() { count++ },
      reset() { count = 0 }
   })
   get maxed = ion(() => count >= limit)

   <Component>
      <button on:click={count.increment} disabled={maxed@}>
         {count@}
      </button>
      {If(maxed@,
         <div class='message'>Limit reached!</div>
         <button on:click={count.reset}>reset</button>
      )}
   </Component>
}
```

#### with pure JSX
```tsx
function Counter({ limit }) {

   const count = ion(0, {
      increment() { count.value++ },
      reset() { count.value = 0 }
   })
   const maxed = ion(() => count() >= limit)

   return Component(
      <>
         <button on:click={count.increment} disabled={maxed}>
            {count}
         </button>
         {If(maxed, () =>
            <>
               <div class='message'>Limit reached!</div>
               <button on:click={count.reset}>reset</button>
            </>
         )}
      </>
   )
}
```


### Type-safety
```tsx
function Profile({ profile }) {
   get editor = NodeRef(Popup);
   get editBtn = NodeRef('button');

   const openEditor = () => {
      if (!editor) return;
      editor.show();
      editor.align(editBtn, 'top');
   }
   
   <Component>
      name: {profile.name@}
      description: {profile.description@}
      <button ref={editBtn} on:click={openEditor}>edit</button>
      <Popup ref={editor}>
         <ProfileEditor {profile} closeEditor={e => editor?.hide()}/>
      </Popup>
   </Component>
}

function Popup({ Slot }) {
   get opened = ion(false);
   const show = () => opened = true;
   const hide = () => opened = false;

   const shift = ionic({ x: 0, y: 0 });
   const align = (node, placement) => { 
      /* alignment logic */
   }

   <Component as={{ show, hide, align }}>
      <o--body>
         {If(opened@,
            <div class='popup' style={{ 
               transform: (`translate(${shift.x), ${shift.y})`)@
            }}>
               {Slot}
            </div>
            <div class='popup-backdrop' on:click={hide}/>
         })
      </o--body>
   </Component>
}
```

## Monospace font recommendations
Because NextScript makes use of an `@` postfix in its syntax, some developers may prefer fonts with a less visually dominant `@` glyph. Fonts that pair well with NextScript’s @ syntax include:
- SF Mono (Apple’s system monospace font)
- Space Mono
- IBM Plex Mono
- Cascadia Mono
- JetBrains Mono
- Commit Mono
- Fira Code




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

When declaring through parameters or destructuring, accessor variables are selectively declared through the `@` postfix operator. Unlike optional parameters, order does not matter.
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

   <Component>
      <p on:click={() => count++}>
         count: {count@}
      </p>
      <p>{count@} x 2 = {doubled@}</p>
      <p>{count@} x 3 = {tripled@}</p>
      <p>{count@} x 4 = {tripled@}</p>
   </Component>
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


## JSX syntactic sugar


### JSX Factory `() => <jsx/>`
A JSX factory is any function that returns a JSX element or fragment.
```tsx
const renderRow = () => <tr><td>Hello</td></tr>
```

### JSX Gateway Return `<//>`
The JSX gateway syntax, `<//>`, signifies a switch from JavaScript to JSX until the end of the containing JavaScript block or expression position. It returns the JSX as a fragment. A JSX gateway is only valid in a statement position or as the arrow of a JSX gateway function expression.

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
A JSX flow expression is a JSX call expression where the final argument is a JSX-like entity:
- JSX factory
- JSX element
- JSX fragment
- JSX children (implicitly wrapped in a JSX fragment by the compiler)
- JSX gateway function expression

The final argument is normalized to a JSX factory at compile time.

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
A JSX gateway function expression is shorthand for an arrow function that returns a fragment-wrapped JSX block. It may only appear as the final argument of a JSX flow expression. Parameter parentheses may be omitted. 

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
   {If(active, o <//>
      Hello world
   )}
</div>
```
compiled:
```tsx
<div>
   {If(active, o =>
      <>
         Hello world
      </>
   )}
</div>
```

source:
```tsx
<div>
   {If(active, o <//>
      {If(open,
         <p>Hello world</p>
      )}
   )}
</div>
```
compiled
```tsx
<div>
   {If(active, o =>
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
The JSX component element is an auto-returned JSX keyword element that allows refs of component instances to be typed. It creates a ComponentKit, a plain object containing the component instance and nodes. The default implementation of JSXComponent simply returns a component kit. 

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
