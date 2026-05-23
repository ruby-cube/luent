<div align="center">
<picture>
  <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/packages/nextscript/assets/nextscript-logo-padded.png" alt="luent-logo"/>
</picture>
</div>

# NextScript

NextScript is an experimental language extension of TypeScript + JSX designed to improve the readability, ergonomics, and type-safety of modern reactive application code. Check out our language design principles [here](#design-principles).

> This project is in early development. Most features have been specified and partially implemented, but substantial tooling work remains before the extension is fully usable. See how to contribute here.

<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation

Reactive UI programming and JSX have both been game changers in web development, turning complex UI updates into simple data bindings. However, JavaScript variables are not natively reactive, and existing solutions to making them reactive have their caveats. What may seem simple and elegant at first glance often creates downstream complexity, conceptual overhead, and/or performance issues through implicit behaviors that do not always align with native JavaScript semantics or patterns.

Getter functions, popularized in the form of signals by Solid.js, show real promise as an explicit, performant conduit to reactivity in JavaScript. Unfortunately, getters have their own set of caveats, such as opaqueness to TypeScript type guards, the visual clutter of getter function calls, or confusion caused by functions with data variable names.

On the templating side, JSX, though elegant in its syntactic rules, can quickly become unwieldy and difficult to read when indentation from fragments and nesting cumulate into indentation hell.

NextScript proposes to address these caveats through a dash of syntactic sugar.


<p align="right"><a href="#readme-top">[top]</a></p>

## Core Features

A brief glimpse of NextScript's offerings. For more details, see NextScript documentation. 

Things to note:

- While some examples below feature API from Luent for demonstration purposes, NextScript was designed to be compatible with any getter-based system. 
- NextScript accessor variables and the accessor postfix operator have no inherent reactivity. They are equally useful for simple live reference passing of “inert” getters. Refs, for example.
- JSX examples assume a conservative XML to JavaScript transpilation strategy with tag bindings that map directly to object properties. NextScript itself transpiles to only TypeScript and JSX. It does not define how TypeScript and JSX are ultimately transpiled to JavaScript.

<p align="right"><a href="#readme-top">[top]</a></p>

### Accessor Variables 
`get variable = getter` • scope-level, locally-bound counterpart to native accessor properties
```ts
get count = ion(start)
get remaining = ion(() => limit - count) // hover [ get count: number ]
```
<pre><code><span style='color: #767C9DB0'>// native equivalent</span>
<span style='color: #91B4D5'>const</span> <span style='color: #E4F0FB'>count</span> <span style='color: #E4F0FB'>=</span> <span style='color: #53D0F6'>ion</span><span style='color: #E4F0FB'>(</span><span style='color: #E4F0FB'>start</span><span style='color: #E4F0FB'>)</span>
<span style='color: #91B4D5'>const</span> <span style='color: #E4F0FB'>remaining</span> <span style='color: #E4F0FB'>=</span> <span style='color: #53D0F6'>ion</span><span style='color: #E4F0FB'>(() =&gt; limit - count())</span>
</code></pre>

<p align="right"><a href="#readme-top">[top]</a></p>

### Accessor Postfix Operator
`variable@` • getter access for reference passing
```ts
watch(count@, () => {
   console.log('The count is', count)
})
```
```ts
// native equivalent
watch(count, () => {
   console.log('The count is', count())
})
```

<p align="right"><a href="#readme-top">[top]</a></p>

### Derivation Expressions
`(expression)@` • derivation-first shorthand for inline arrow function expressions
```tsx
<button on:click={() => count++} disabled={(count >= limit)@}>
   +
</button>
```
```tsx
// native equivalent
<button on:click={() => count.value++} disabled={() => count() >= limit}>
   +
</button>
```

<p align="right"><a href="#readme-top">[top]</a></p>

### JSX Flow Expressions
`{Fn(...args, <tag>)}` • template control flow with implicit JSX fragment factories
```tsx
<div>
   {If(remaining,
      <div class='message'>You have {remaining@} slots left.</div>
      <div class='message'>You started with {start} powers.</div>
   )}
   {Else(
      <div class='message'>Powerset complete.</div>
   )}
</div>
```
```tsx
// native equivalent
<div>
   {If(remaining, () => <>
      <div class='message'>You have {remaining@} slots left.</div>
      <div class='message'>You started with {start} powers.</div>
   </>)}
   {Else(() => <>
      <div class='message'>Powerset complete.</div>
   </>)}
</div>
```

<p align="right"><a href="#readme-top">[top]</a></p>

### JSX Gateway Function Expression
`(parameters) <//> JSX` | `<//> JSX` • JSX fragment factory shorthand within JSX flow expressions

no parameters:
```tsx
<div>
   {If(active, <//>
      {If(opened, <//>
         <h3>Hi!</h3>
         <p>How can I help you?</p>
         <button on:click={close}>-</button>
      )}
      {Else(
         <button on:click={open}>Enter</button>
      )}
   )}
   {Else(<//>
      <h3>Sleeping</h3>
      <p>Come back later...</p>
   )}
</div>
```
```tsx
// native equivalent
<div>
   {If(active, () => <>
      {If(opened,  () => <>
         <h3>Hi!</h3>
         <p>How can I help you?</p>
         <button on:click={close}>-</button>
      </>)}
      {Else(() => <>
         <button on:click={open}>Enter</button>
      </>)}
   </>)}
   {Else(() => <>
      <h3>Sleeping</h3>
      <p>Come back later...</p>
   </>)}
</div>
```
with parameters:
```tsx
<div>
   {For(items, (item) <//>
      <div>{item.title}</div>
      <hr/>
   )}
</div>
```
```tsx
// native equivalent
<div>
   {For(items, (item) => <>
      <div>{item.title}</div>
      <hr/>
   </>)}
</div>
```

<p align="right"><a href="#readme-top">[top]</a></p>

### JSX Attribute Shorthand
`{attribute}` • shorthand for repetitive attribute binding
```tsx
<Tooltip {tooltip}>
```
```tsx
// native equivalent
<Tooltip tooltip={tooltip}>
```

<p align="right"><a href="#readme-top">[top]</a></p>

### JSX Component Element
`<:component>...</:component>` • implicitly returned component kit with type information for refs
```tsx
function Dialog({ Slot }) {
   get opened = ion(false)
   const open = () => { opened = true }
   const close = () => { opened = false }

   <:component as={{ open, close }}>  // provides type information for the ref attribute
      {If(opened, 
         <o--body>
            <div class='dialog'>{Slot()}</div>
         </o--body>
      )}
   </:component>
}
```
```tsx
// native equivalent
function Dialog({ Slot }) {
   const opened = ion(false)
   const open = () => { opened.value = true }
   const close = () => { opened.value = false }

   return {
      component: { open, close }, // provides type information for the ref attribute
      nodes: (
         <>
            {If(opened, 
               <o--body>
                  <div class='dialog'>{Slot()}</div>
               </o--body>
            )}
         </>
      )
   }
}
```

<p align="right"><a href="#readme-top">[top]</a></p>

### Type-guard-aware accessor variables
e.g. `if(obj) { obj.property }` • Type-narrowing and -widening of accessor variables

```tsx
get user = ion(null as User | null)

function logUsername() {
   if (!user) return;
   console.log('username:' user.name)
}
```
```tsx
// native equivalent
const user = ion(null as User | null)

function logUsername() {
   if (!user()) return;
   console.log('username:' user()!.name)
}
```
```tsx
// alternative native equivalent
const user = ion(null as User | null)

function logUsername() {
   const u = user();
   if (!u) return;
   console.log('username:' u.name)
}
```


<p align="right"><a href="#readme-top">[top]</a></p>

## Design Principles

### Conceptual elegance and predictability
When language rules are simple and consistent, code becomes less bug-prone and less mentally taxing to read and write. As a language extension, NextScript should remain coherent with its foundational languages and preserve predictable behavior.

—

### Syntactic elegance
Simple and consistent syntax allows developers to read and write code with less friction, improving readability and developer ergonomics.

—

### Principled magic, not spookiness
NextScript introduces new syntax carefully, favoring explicitness whenever possible. It allows implicit behavior only when that behavior is locally deducible and provides sufficient ergonomic benefit to justify the added language complexity. 

The goal is not to avoid magic altogether, but to avoid *unaccountable* magic: behavior that feels arbitrary, exceptional, or difficult to reason about.

<p align="right"><a href="#readme-top">[top]</a></p>


## Monospace font recommendations
Because NextScript makes use of an `@` postfix in its syntax, some developers may prefer fonts with a less visually dominant `@` glyph. Fonts that pair well with NextScript’s `@` syntax include:
- SF Mono (Apple’s system monospace font)
- Space Mono
- IBM Plex Mono
- Cascadia Mono
- JetBrains Mono
- Commit Mono
- Fira Code
