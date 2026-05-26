<div align="center">
<picture>
  <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/assets/luent-logo-site-ambicolor.png" alt="luent-logo"/>
</picture>
<p><a href='https://nextscript.org/getter-syntax'>learn</a> &nbsp;&nbsp;-&nbsp;&nbsp; <a href='https://nextscript.org/examples'>play</a> &nbsp;&nbsp;-&nbsp;&nbsp; <a href='#motivation'>motivation</a> &nbsp;&nbsp;-&nbsp;&nbsp; <a href='#design-principles'>principles</a> &nbsp;&nbsp;-&nbsp;&nbsp; <a href='https://github.com/ruby-cube/luent/blob/main/packages/nextscript#nextscript'>nextscript</a></p>
</div>

# Luent
Luent is a web application framework that aims to bring greater conceptual coherence to the complexities of modern web development. It combines a fine-grained reactivity system, DOM manipulation engine, and JSX transpiler, all written from scratch with much tender loving care and obsessive experimentation. The project also introduces [NextScript](https://github.com/ruby-cube/luent/blob/main/packages/nextscript#nextscript), an optional TypeScript + JSX language extension designed to improve the readability, ergonomics, and type-safety of reactive code.

> **This project is in early development.** Most standard client-side functionality is already working and relatively stable, but bugs, rough edges, unhandled cases, and some amount of experimental churn should be expected. We have yet to publish an npm package or CLI. In the meantime, you can explore Luent through interactive [StackBlitz examples](). 
>
> NextScript features have mostly been implemented but require substantial tooling work before the extension is fully usable. You can get a sense of NextScript's syntax through these [code glimpses]() and [examples]().
>
> We'd love help getting this project off the ground. See how to [contribute](https://github.com/ruby-cube/luent/blob/main/CONTRIBUTING.md).


<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation
Modern frameworks have brought powerful innovations to web development. While these frameworks have significantly advanced the ecosystem, they also come with additional cognitive overhead, often through syntax, abstractions, and patterns that run counter to native web technologies and developer intuition. 

Coming from a linguistics and design background, I care deeply about language coherence, expressiveness, and code aesthetics. These interests led me to delve into how syntax and API design might improve the way we build modern web applications while minimizing complexity. The key challenge is understanding how far we can move toward simplicity without trading off conceptual integrity and technical rigor. This project explores that challenge.


<p align="right"><a href="#readme-top">[top]</a></p>

## Features
Luent currently provides most of the standard features expected of a modern frontend framework, with server-side features planned.

Core design features:
- a unified system of fine-grained reactivity through `ion()` and `ionic()`
- state management through familiar native structures
- selective, type-explicit reactivity
- traceable mutations to aid in debugging reactivity

Other notable features:
- x-ray binding and smart auto-binding for authoring flexible components
- a reactive finite state machine API via `Finitron`
- ergonomic asynchronous reactivity
- ergonomic preservation of state and DOM nodes through a `'remount'` directive or `<remount-view>` tag

Experimental areas:
- [WIP] language extension of TypeScript + JSX for improved readability and type-safety (see [NextScript](https://github.com/ruby-cube/luent/blob/main/packages/nextscript#nextscript))
- [WIP] compile-time mutation tracking
- selective nested reactivity
- encapsulated reactivity

<p align="right"><a href="#readme-top">[top]</a></p>


### JSX Transpiler

Luent transpiles JSX conservatively using the standard JSX transpiler for easy mental mapping. Luent additionally extends the transpiler with three minimal transforms:
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
Luent is being developed under these guiding principles, which encapsulate our values and how we navigate tradeoffs:

- **Human-centered, AI-friendly.**
We take a human-centered approach, both in the development of this project and the framework design. The vision, creativity, and needs of humans are the driving force behind this project. AI plays a supporting role. We believe interfaces designed for human clarity also tend to work well with AI systems. By designing for humans first, we often create systems that are naturally AI-friendly as well.

- **Elegance and simplicity.**
Elegance—both conceptual and syntactic—is central to Luent’s API design. We pursue simple solutions through extensive experimentation and relentless trimming of excess.

- **Intuitive mental models.**
Luent aims to be as invisible as possible so developers can focus on application logic rather than framework mechanics. We strive to minimize mental code-switching by supporting mental models grounded in native web technologies and familiar programming fundamentals.

- **High-level abstractions.**
Abstractions should emphasize high-level concerns while minimizing exposure to underlying implementation details. We favor clear, descriptive terminology over low-level technical jargon.

- **Consistency over aesthetics.**
While aesthetics matter, the pursuit of visually elegant code should never introduce inconsistencies in the language or unpredictable magic. Clean syntax should emerge from carefully designed rules and principled syntactic sugar.

- **Clarity and expressiveness over brevity.**
Concise code is valuable, but not at the expense of basic clarity, flexibility, and type-safety. Developers should never feel constrained by the framework for the sake of terseness or visual minimalism.

- **Elimination of bug-prone patterns.**
Luent should absorb as much repetitive and error-prone infrastructure as possible to reduce time spent debugging an application.

- **Pragmatic type-safety.**
We strive to improve type-safety whenever possible while also recognizing that manual solutions are sometimes preferable when the costs outweigh the benefits or TypeScript itself imposes limitations.

- **Quality over speed.**
Keeping up a reasonable pace is desirable, but quality should not be compromised for the sake of development speed. 

- **Great user experiences.**
All of this ultimately serves the end user. We embrace build steps when they improve developer ergonomics without compromising runtime performance. We prioritize expressiveness and stability in our framework design because they form the foundation developers rely on to build, evolve, and maintain great user experiences. A solid framework → good DX → great UX.

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
