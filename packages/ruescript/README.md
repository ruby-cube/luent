<div align="center">
<picture>
  <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/luent-logo-site-ambicolor.png" alt="luent-logo"/>
</picture>
</div>

# NextScript Readme

NextScript is an experimental language extension of TypeScript + JSX designed to improve the readability, ergonomics, and type-safety of modern reactive application code.

> This project is in early development. Most features have been specified and partially implemented, but substantial tooling work remains before the extension is fully usable. See how to contribute here.


<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation

Reactive UI programming and JSX have both been game changers in web development, turning complex UI updates into simple, readable data bindings. However, JavaScript variables are not natively reactive, and existing solutions to making them reactive have their caveats. Solutions often seem simple and elegant at first glance only to create complexity, conceptual overhead, and/or performance issues down the line through implicit behavior that do not always align with native JavaScript semantics or patterns.

Getter functions, popularized in the form of signals by Solid.js, show real promise as an explicit, performant conduit to reactivity in JavaScript. Unfortunately, getters have their own set of caveats, such as not playing well with TypeScript type guards, impacting readability due to the visual clutter of functions and function calls, or the confusion caused by functions cloaked in data variable naming.

On the templating side, JSX, though elegant in its syntactic rules, can quickly become unwieldy and difficult to read when indentation from fragments and nesting cumulate into indentation hell. Furthermore, control flow through ternaries aren’t always intuitive.

NextScript proposes to address these caveats through thoughtfully designed syntactic sugar and principled shorthands.


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
- **implicit template render functions** for improved readability of control flow

### Ergonomics
- **accessor postfix operator** to facilitate reference passing
- **colon notation for accessor properties** for ergonomic accessor property declarations
- **implicit JSX return** for clean render functions
- **implicit JSX fragments** within template functions for improved readability and ergonomics
- **JSX attribute shorthand** to reduce redundancy

### Type-safety
- **type-guarding of accessor variables** for improved type-safety
- **type-guarding via If/Else template calls** for improved type-safety
- **a dedicated component element** for type-safe component refs

### Planned features:
- **async sequence statements** for improved readability of async sequences 
- **class property access modifiers** to ergonomically manage complex access rights

> **Note:** Though primarily designed to accommodate getter-based reactivity, NextScript accessor variables and the accessor postfix operator have no inherent reactivity. They are equally useful for simple live reference passing of “inert” getters. Refs, for example.


<p align="right"><a href="#readme-top">[top]</a></p>

## Code comparison
> **Note:** While the examples below feature API from Luent for demonstration purposes, NextScript may be used independently of Luent.


### Code readability
#### with NextScript
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

### Implicit JSX Return & JSX Fragments
`function View() { <element/> }`
Functions that contain JSX elements (or fragments) that are not nested in declarations or other expressions will implicitly wrap the JSX elements in a fragment and return that fragment.
```tsx
function Counter() {
   get count = ion(0)
   
   <div>{count}</div>
   <button on:click={() => count++}>
      +
   </button>
}
```

### Implicit Template Render Functions

#### … in template call expressions
`{If(active, <element/>)}`
JSX elements that are passed as the final argument of a call expression are implicitly wrapped in a render function. 
```tsx
<div>
   {If(loggedIn@, 
      <Welcome user={user@} />
   )}
   {Else(
      <Signin />
   )}
<div>
```

#### … in slots
JSX element passed into slots (known as children in classic JSX) are also implicitly wrapped in a render function.
```tsx
<List>
   <ListItem {item}></ListItem>
   <ListItem {item}></ListItem>
   <ListItem {item}></ListItem>
</List>
```

### JSX Attribute Shorthand
`<Element {attribute}></Element>`
Similar to property shorthands in object literals, attribute assignment may be shortend to the attribute shorthand if the attribute name matches the variable name.
```tsx
const tooltip = createTooltip('open')

<Tooltip {tooltip} />
```

### The Component Element
`<Component as={component}></Component>`
The component element allows refs of component instances to be typed. It creates a ComponentKit, a plain object containing the component instance and nodes.
```ts
interface ComponentKit<T> {
   component: T
   nodes: unknown[];
}
```
```ts
function Dialog({ Slot }) {
   get opened = ion(false)
   const open = () => { opened = true }
   const close = () => { opened = false }

   <Component as={{ open, close }}>  
      {If(opened, 
         <o--body>
            <div>{Slot()}</div>
         </o--body>
      )}
   </Component>
}
```
```ts
get dialog = NodeRef(Dialog)

<button on:click={() => dialog?.open()}>submit</button>
<Dialog ref={dialog}>
   <DialogContent close={() => dialog?.close()}/>
</Dialog>
```

### Type-guarding in JSX control flow call expressions

NextScript will apply type-narrowing and -widening rules to template calls of function whose names are designated control flow names:
- `If`/`ElseIf`/`Else`
- `Switch`/`Case`/`Default`
- `Match`/`Case`/`Default`
- `As`
```ts
<div>
   {If(user@, 
      <Welcome user={user@} />
   )}
   {Else(
      <Signin />
   )}
<div>
```
