<div align="center">
<picture>
  <img width="320" src="https://github.com/ruby-cube/luent/blob/cave/luent-logo-github-desaturated.png" alt="luent-logo"/>
</picture>
</div>

# Luent
Luent is a highly expressive web framework aiming to bring coherence to the complexities of modern web development. It consists of a fine-grained reactivity system, rendering engine, and JSX transpiler, all written from scratch with much tender loving care and obsessive experimentation. The project also introduces NextScript, an optional minimal syntactic language extension of Typescript JSX designed to make writing reactive code more elegant and type-safe without employing magic or counter-intuitive mental models.

<p align="right"><a href="#readme-top">[top]</a></p>

## Code glimpse

Below are some examples. For more, see Luent at a glance and NextScript at a glance.

#### Luent with JSX
Ions are Luent's main reactive primitive. The `ion` function is used to create atomic reactive state as well as reactive derivations.

```tsx
function Counter() {

   const count = ion(0)
   const maxed = ion(() => count() >= 100)

   return Component(
      <>
         <button on:click={() => count.value++} disabled={maxed}>
            {count}
         </button>
         {If(maxed, () =>
            <div class='message'>Max reached!</div>
         )}
      </>
   )
}
```

#### Luent with NextScript
In NextScript, the `get` keyword may be used to declare accessor variables, which behave similarly to native accessor properties. The `@` postfix operator enables access to the getter of an accessor variable/property. Functions containing root-level JSX implicitly returns the JSX.

```tsx
function Counter() {

   get count = ion(0)
   get maxed = ion(() => count >= 100)

   <Component>
      <button on:click={() => count++} disabled={maxed@}>
         {count@}
      </button>
      {If(maxed@,
         <div class='message'>Max reached!</div>
      )}
   </Component>
}
```


<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation
Modern frameworks bring powerful innovations to web development but often introduce cognitive overhead through abstractions that diverge from native web technologies and developer intuition. This project explores how framework APIs and syntax design can minimize complexity and cognitive overhead with fresh ideas while staying aligned with native behavior and established standards. The project also explores how developer ergonomics can coexist with conceptual integrity and technical rigor—qualities all frameworks must inevitably balance and negotiate.

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
Luent is being developed under these guiding principles which encapsulate our values and how they are prioritized:

- **Human-centered, AI-friendly.**
We take a human-centered approach both in the development of this project and the framework design. The vision, grit, and needs of humans are the driving force behind this project. AI will never take the driver's seat, only a supporting role. Since human-centered interfaces are incidentally AI-friendly due to how LLMs work, we opt to focus on humans.

- **Elegance and simplicity.**
Elegance—both conceptual and syntactic—is central to Luent’s API design. We seek out simple solutions through extensive experimentation and relentless removal of excess.

- **Intuitive mental models.**
Luent aims to be as invisible as possible so developers can focus on application logic rather than framework mechanics. We strive to minimize mental code-switching and memorization by supporting mental models grounded in native web technologies and familiar programming fundamentals.

- **High-level abstractions.**
Abstractions should emphasize high-level concerns while minimizing implementation leakage. We favor clear, descriptive terminology over low-level technical jargon.

- **Consistency over aesthetics.**
While aesthetics matter, the pursuit of visually elegant code should never introduce inconsistencies in the language or unpredictable magic. Clean syntax should be acheived through carefully designed rules and rigorously specified syntactic sugar.

- **Clarity and expressiveness over brevity.**
Concise code is valuable, but not at the expense of clarity or flexibility. Developers should never feel constrained by the framework for the sake of terseness or visual minimalism.

- **Elimination of bug-prone patterns.**
Luent should absorb as much repetitive and error-prone infrastructure as possible to reduce application developers’ time spent debugging.

- **Ultimately: Great user experiences.**
All of this is ultimately in service of the end user. We embrace build steps because they enable better developer ergonomics without sacrificing runtime performance. We preserve framework and language consistency to ensure a stable foundation for developers to write reliable, maintainable software. We strive to create ease for developers so that they have more bandwidth to build great user experiences. A solid framework → good DX → great UX.


<p align="right"><a href="#readme-top">[top]</a></p>

## Prior Art

This project stands on the shoulders of the giants who have shaped modern web development. It draws inspiration from the elegance and consistency of React and JSX, the intuitiveness and thoughtfulness of Vue, the enviable aesthetics of Svelte, the pure insightfulness of Solid, and the thoroughness of Angular.

Particular acknowledgement to the people and projects I've especially admired:

- Vue.js, the framework I fell in love with and that introduced me to the world of reactivity. Its getter-based reactivity and seeds of fine-grained reactivity heavily influenced Quarky (Luent's reactivity system).
- Solid.js, which later became a guiding light, particularly in how I approach component props in a signals-based framework.
- Evan You and the Vue team, whose dedication to developer experience has greatly influenced how I approach designing Luent
- Ryan Carniato, whose articles and streams have become an encouraging source of clarity and affirmation for this project


<p align="right"><a href="#readme-top">[top]</a></p>


## Current status

Our current goal is to establish an intuitive and expressive API that enhances developer experience and productivity.

Once the API stabilizes, development will increasingly focus on runtime efficiency, treeshakability, smaller bundle sizes, and shifting more work from runtime to compile time.


> This project is in early development. Most standard client-side functionality is already working and relatively stable, but bugs, rough edges, and unhandled edge cases should be expected. See how to contribute here.


<p align="right"><a href="#readme-top">[top]</a></p>

© 2025 - present [Ruby Y Wang](https://github.com/ruby-cube)
