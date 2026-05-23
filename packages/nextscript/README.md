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

## Code Glimpse

A brief glimpse of three of NextScript's offerings. For the full set of features, see NextScript documentation. 

Things to note:

- While some examples below feature API from Luent for demonstration purposes, NextScript was designed to be compatible with any getter-based system. 
- NextScript accessor variables and the accessor postfix operator have no inherent reactivity. They are equally useful for simple live reference passing of “inert” getters. Refs, for example.


<p align="right"><a href="#readme-top">[top]</a></p>

### Accessor Variables 
`get variable = getter` • scope-level, locally-bound counterpart to native accessor properties
```ts
get count = ion(start)
get remaining = ion(() => limit - count) // hover [ get count: number ]
```
```tsx
// native equivalent
const count = ion(start)
const remaining = ion(() => limit - count())
```

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
const $user = ion(null as User | null)

function logUsername() {
   const user = $user();
   if (!user) return;
   console.log('username:' user.name)
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
