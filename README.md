<div align="center">
<picture>
  <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/luent-logo-site-ambicolor.png" alt="luent-logo"/>
</picture>
</div>

# Luent
Luent is a highly expressive web framework that aims to provide greater conceptual coherence amid the complexities of modern web development. It consists of a fine-grained reactivity system, DOM manipulation engine, and JSX transpiler, all written from scratch with much tender loving care and obsessive experimentation. The project also introduces NextScript (.nsx), an optional language extension of Typescript + JSX designed to make reactive code more readable and type-safe.

> This project is in early development. Most standard client-side functionality is already working and relatively stable, but bugs, rough edges, unhandled cases, and some amount of experimental churn should be expected. See how to contribute here.

<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation
Modern frameworks have brought powerful innovations to web development but have also introduced additional cognitive overhead, often through syntax, abstractions, and patterns that run counter to native web technologies and developer intuition. 

Coming from a linguistics and design background, I am particularly passionate about both language coherence and code aesthetics and deeply interested in how we might design syntax and APIs that advance technology while minimizing complexity. The key challenge is understanding how far we can move towards simplicity without trading off conceptual integrity and technical rigor. This project explores that challenge.


<p align="right"><a href="#readme-top">[top]</a></p>

## Code glimpse
> For more examples, see Luent at a glance and NextScript at a glance.

Below are some code examples featuring API and syntax from Luent and NextScript. A few orientation notes: 

- Ions are Luent's main reactive primitive. The `ion` function creates atomic reactive state as well as memoized derivations. 
- The `FromTag` utility type transforms component tag bindings into script-friendly properties. For example, the 'class' binding becomes 'classes' and maybe-ions are normalized to ions. 

In NextScript:
- The `get` keyword declares accessor variables, which behave similarly to native accessor properties. 
- The `@` postfix operator enables access to the getter of an accessor variable/property. 
- Functions containing JSX statements implicitly return the JSX.


#### Luent with NextScript

```tsx
function Counter(setup: FromTag<{
   limit: number, 
   class: Ion<TagClass> 
}>) {
   const { limit, classes@ } = setup;

   get count = ion(0)
   get maxed = ion(() => count >= limit)

   <Component>
      <button class={classes@} on:click={() => count++} disabled={maxed@}>
         {count@}
      </button>
      {If(maxed@,
         <div class='message'>Limit reached!</div>
      )}
   </Component>
}

createRoot(() => 
   <Counter class='outlined' limit={100} />
).mount('#root')

```

#### Luent with TypeScript + JSX


```tsx
function Counter(setup: FromTag<{ 
   limit: number, 
   class: Ion<TagClass> 
}>) {
   const { limit, $classes } = setup;

   const count = ion(0)
   const maxed = ion(() => count() >= limit)

   return Component(
      <>
         <button class={$classes} on:click={() => count.value++} disabled={maxed}>
            {count}
         </button>
         {If(maxed,
            <div class='message'>Limit reached!</div>
         )}
      </>
   )
}

createRoot(() =>
   <Counter class='outlined' limit={100} />
).mount('#root')

```



<p align="right"><a href="#readme-top">[top]</a></p>


## Features
Luent currently provides most of the standard features expected of a modern frontend framework, with server-side features planned.

Core design features:
- a unified system of fine-grained reactivity
- simplicity in managing shared and centralized state through familiar native structures
- selective, type-explicit reactivity
- traceable mutations to aid in debugging reactivity

Other notable features:
- x-ray binding and smart auto-binding for greater ease in authoring flexible components
- a reactive finite state machine API
- ergonomic asynchronous reactivity
- ergonomic preservation of state and DOM nodes through a `'remount'` directive and `<remount-view>` tag

Experimental areas:
- NextScript language extension for improved readability and type-safety (WIP)
- compile-time mutation tracking (WIP)
- selective nested reactivity
- encapsulated reactivity


<p align="right"><a href="#readme-top">[top]</a></p>

## Design Principles
Luent is being developed under these guiding principles, which encapsulate our values and how we view competing values:

- **Human-centered, AI-friendly.**
We take a human-centered approach, both in the development of this project and the framework design. The vision, creativity, and needs of humans are the driving force behind this project. AI plays a supporting role. Since human-centered interfaces are also incidentally AI-friendly due to how LLMs work, we focus on designing for humans.

- **Elegance and simplicity.**
Elegance—both conceptual and syntactic—is central to Luent’s API design. We seek out simple solutions through extensive experimentation and relentless trimming of excess.

- **Intuitive mental models.**
Luent aims to be as invisible as possible so developers can focus on application logic rather than framework mechanics. We strive to minimize mental code-switching by supporting mental models grounded in native web technologies and familiar programming fundamentals.

- **High-level abstractions.**
Abstractions should emphasize high-level concerns while minimizing implementation leakage. We favor clear, descriptive terminology over low-level technical jargon.

- **Consistency over aesthetics.**
While aesthetics matter, the pursuit of visually elegant code should never introduce inconsistencies in the language or unpredictable magic. Clean syntax should be acheived through carefully designed rules and rigorously specified syntactic sugar.

- **Clarity and expressiveness over brevity.**
Concise code is valuable, but not at the expense of basic clarity, flexibility, and type-safety. Developers should never feel constrained by the framework for the sake of terseness or visual minimalism.

- **Elimination of bug-prone patterns.**
Luent should absorb as much repetitive and error-prone infrastructure as possible to reduce time spent debugging an application.

- **Quality over speed.**
Keeping up a reasonable pace is desirable, but quality should not be compromised for the sake of development speed. 

- **Great user experiences.**
All of this is in service of the end user. We embrace build steps because they enable better developer ergonomics without sacrificing runtime performance. We preserve framework and language consistency to ensure a stable foundation for developers. We strive to create stability and ease for developers so that they can build, grow, and maintain great user experiences. A solid framework → good DX → great UX.


<p align="right"><a href="#readme-top">[top]</a></p>


## Prior Art

This project builds upon ideas pioneered by frameworks that have shaped modern web development. It draws inspiration from the consistency of React, the intuitiveness of Vue, the aesthetics of Svelte, the insightfulness of Solid, and the thoroughness of Angular.

Particular acknowledgement to the people and projects I've especially admired:

- Vue 3, the framework I fell in love with and that sparked my fascination with frontend frameworks. Its getter-based reactivity and seeds of fine-grained reactivity heavily influenced Quarky (Luent's reactivity system).
- Solid.js, which later became a guiding light, particularly in how to approach component props and derivations in a signals-based framework
- Ryan Carniato, whose articles and streams have been an encouraging source of clarity and affirmation
- Evan You and the Vue team, whose dedication to developer experience has greatly informed how I approach designing Luent


<p align="right"><a href="#readme-top">[top]</a></p>


## Current status

The current goal is to establish an intuitive and expressive API that enhances developer experience and productivity.

Once the API stabilizes, development will increasingly focus on runtime efficiency, treeshakability, smaller bundle sizes, and shifting more work from runtime to compile time.


<p align="right"><a href="#readme-top">[top]</a></p>

© 2025 - present [Ruby Y Wang](https://github.com/ruby-cube)
