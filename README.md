<div align="center">
<picture>
  <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/luent-logo-site-ambicolor.png" alt="luent-logo"/>
</picture>
</div>

# Luent
Luent is a highly expressive web framework that aims to provide greater conceptual coherence amid the complexities of modern web development. It consists of a fine-grained reactivity system, DOM manipulation engine, and JSX transpiler, all written from scratch with much tender loving care and obsessive experimentation. The project also introduces NextScript, an optional syntax extension of Typescript JSX designed to make writing reactive code more clean and type-safe without employing magic or counter-intuitive mental models.

> This project is in early development. Most standard client-side functionality is already working and relatively stable, but bugs, rough edges, unhandled cases, and experimental churn should be expected. See how to contribute here.

<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation
Modern frameworks have brought powerful innovations to web development but have also introduced cognitive overhead often through syntax, abstractions, and patterns that run counter to native web technologies and developer intuition. As someone from a linguistics and design background, I am deeply interested in how we might design syntax and APIs that advance technology while still aligning with established standards so that we minimize complexity and mental overhead. The key challenge is understanding how far we can move towards simplicity without trading off conceptual integrity and technical rigor. This project explores that challenge.

<p align="right"><a href="#readme-top">[top]</a></p>

## Code glimpse

> For more examples, see Luent at a glance and NextScript at a glance.

#### Luent with TypeScript JSX
Ions are Luent's main reactive primitive. The `ion` function creates atomic reactive state as well as memoized derivations.

```tsx
function Counter({ limit }: FromTag<{ limit: number }>) {

   const count = ion(0)
   const maxed = ion(() => count() >= limit)

   return Component(
      <>
         <button on:click={() => count.value++} disabled={maxed}>
            {count}
         </button>
         {If(maxed,
            <div class='message'>Limit reached!</div>
         )}
      </>
   )
}
```

#### Luent with NextScript
In NextScript, the `get` keyword declares accessor variables, which behave similarly to native accessor properties. The `@` postfix operator enables access to the getter of an accessor variable/property. Functions containing JSX statements implicitly return the JSX.

```tsx
function Counter({ limit }: FromTag<{ limit: number }>) {

   get count = ion(0)
   get maxed = ion(() => count >= limit)

   <Component>
      <button on:click={() => count++} disabled={maxed@}>
         {count@}
      </button>
      {If(maxed@,
         <div class='message'>Limit reached!</div>
      )}
   </Component>
}
```


<p align="right"><a href="#readme-top">[top]</a></p>


## Features
Luent currently provides most of the standard features expected of a modern frontend framework, with server-side features planned. It specially features:
- a unified system of fine-grained reactivity that is consistent with native behavior
- simplicity in managing shared and centralized state through familiar native structures
- trackable and traceable mutations to aid in debugging reactivity

Luent also supports and encourages:
- type safety
- readable dynamic templates
- encapsulation for clarity within complexity
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
Concise code is valuable, but not at the expense of clarity or flexibility. Developers should never feel constrained by the framework for the sake of terseness or visual minimalism.

- **Elimination of bug-prone patterns.**
Luent should absorb as much repetitive and error-prone infrastructure as possible to reduce time spent debugging an application.

- **Quality over speed**
Keeping up a reasonable pace is desirable, but quality should not be compromised for the sake of development speed. 

- **Ultimately: Great user experiences.**
All of this is in service of the end user. We preserve framework and language consistency to ensure a stable foundation for developers. We strive to create ease for developers so that they can build, grow, and maintain great user experiences. We also embrace build steps because they enable better developer ergonomics without sacrificing runtime performance. A solid framework → good DX → great UX.


<p align="right"><a href="#readme-top">[top]</a></p>

## Prior Art

This project builds upon ideas pioneered by frameworks that have shaped modern web development. It draws inspiration from the consistency of React, the intuitiveness of Vue, the clean aesthetics of Svelte, the insightfulness of Solid, and the thoroughness of Angular.

Particular acknowledgement to the people and projects I've especially admired:

- Vue 3, the framework I fell in love with and that sparked my fascination with frontend frameworks. Its getter-based reactivity and seeds of fine-grained reactivity heavily influenced Quarky (Luent's reactivity system).
- Solid.js, which later became a guiding light, particularly in how I approach component props in a signals-based framework.
- Evan You and the Vue team, whose dedication to developer experience has greatly informed how I approach designing Luent
- Ryan Carniato, whose articles and streams have been an encouraging source of clarity and affirmation for this project


<p align="right"><a href="#readme-top">[top]</a></p>


## Current status

The current goal is to establish an intuitive and expressive API that enhances developer experience and productivity.

Once the API stabilizes, development will increasingly focus on runtime efficiency, treeshakability, smaller bundle sizes, and shifting more work from runtime to compile time.




<p align="right"><a href="#readme-top">[top]</a></p>

© 2025 - present [Ruby Y Wang](https://github.com/ruby-cube)
