<div align="center">
<picture>
  <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/assets/luent-logo-site-ambicolor.png" alt="luent-logo"/>
</picture>
</div>

# Luent
Luent is a highly expressive web framework that aims to provide greater conceptual coherence amid the complexities of modern web development. It consists of a fine-grained reactivity system, DOM manipulation engine, and JSX transpiler, all written from scratch with much tender loving care and obsessive experimentation. The project also introduces NextScript, an optional language extension of Typescript + JSX designed to make reactive code more explicit, readable, ergonomic, and type-safe.

> This project is in early development. Most standard client-side functionality is already working and relatively stable, but bugs, rough edges, unhandled cases, and some amount of experimental churn should be expected. See how to contribute here.

## Monorepo Install Behavior
This repo uses pnpm with `recursiveInstall: false` in [pnpm-workspace.yaml](pnpm-workspace.yaml), so `pnpm install` only installs the current package by default.

To bootstrap the entire workspace explicitly, run:

```bash
pnpm -r install
```

For package-scoped work, prefer filtered commands such as:

```bash
pnpm --filter ./websites/nextscript-site add -D vitepress@next
```

<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation
Modern frameworks have brought powerful innovations to web development but have also introduced additional cognitive overhead, often through syntax, abstractions, and patterns that run counter to native web technologies and developer intuition. 

Coming from a linguistics and design background, I am particularly passionate about both language coherence, expressiveness, and code aesthetics and deeply interested in how we might design syntax and APIs that advance technology while minimizing complexity. The key challenge is understanding how far we can move towards simplicity without trading off conceptual integrity and technical rigor. This project explores that challenge.


<p align="right"><a href="#readme-top">[top]</a></p>

## Features
Luent currently provides most of the standard features expected of a modern frontend framework, with server-side features planned.

Core design features:
- a unified system of fine-grained reactivity through `ion()` and `ionic()`
- simplicity in managing shared and centralized state through familiar native structures
- selective, type-explicit reactivity
- traceable mutations to aid in debugging reactivity

Other notable features:
- x-ray binding and smart auto-binding for greater ease in authoring flexible components
- a reactive finite state machine API via `Finitron`
- ergonomic asynchronous reactivity
- ergonomic preservation of state and DOM nodes through a `'remount'` directive and `<remount-view>` tag

Experimental areas:
- NextScript language extension of TypeScript + JSX for improved readability and type-safety [work-in-progress]
- compile-time mutation tracking [work-in-progress]
- selective nested reactivity
- encapsulated reactivity

<p align="right"><a href="#readme-top">[top]</a></p>


### JSX Transpiler

Luent transpiles JSX consistently and conservatively using the standard JSX transpiler for easy mental mapping. Luent currently extends the transpiler with three minimal transforms:
- JSX slots (known as `children` in classic JSX) are normalized to JSX array factories so that parents may be created before children. E.g. `<Parent><Child/></Parent>` → `jsx(Parent, { Slot: () => [jsx(Child)] })`
- JSX flow expressions (designated JSX call expressions that form a control flow series) are compiled into a single series node. This could be done at runtime, but Luent takes care of this at compile-time for better runtime performance.
- JSX flow expression slots (the final argument of a JSX flow expression) are also normalized to JSX array factories.

The following JSX template...
```jsx
<Parent foo={foo} bar={bar()} on:click={logClick}>
  <Child />
  {If(active, 
    <div>Hello world! - {name}</div>
  )}
  {Else(
    <div>zzzzzz</div>
  )}
</Parent>
```

...essentially maps to:
```jsx
jsx(Parent, { foo: foo, bar: bar(), 'on:click': logClick,
  Slot: () => [
    jsx(Child),
    IfSeries(
      If(active, () => [
        jsx('div', { Slot: () => ['Hello world! - ', name]})
      ]),
      Else(() => [
        jsx('div', { Slot: () => ['zzzzzz']})
      ])
    )
  ]
})
```


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

## License
[MIT license](https://github.com/ruby-cube/luent/blob/main/LICENSE)
