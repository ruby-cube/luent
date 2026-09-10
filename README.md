<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/ruby-cube/luent/blob/cave/assets/luent-logo-padded-dark.png">
  <img width="200" alt="luent logo" src="https://github.com/ruby-cube/luent/blob/cave/assets/luent-logo-padded-light.png">

</picture>
  
<p><a href='https://luent.dev/#code-glimpses'>tour</a> &nbsp;-&nbsp; <a href='http://luent.dev/demos/habit-tracker.html'>demo</a> &nbsp;-&nbsp; <a href='http://luent.dev/api/overview.html'>API</a> &nbsp;-&nbsp; <a href='#motivation'>motivation</a>
</div>

# Luent

Luent is a web framework designed around conceptual coherence, expressiveness, and clarity. It consists of a reactivity system, rendering engine, and JSX transpiler, all written from scratch with much tender loving care and obsessive experimentation.

Core features:
- a unified system of fine-grained reactivity
- state management through familiar native structures
- control flow expressions to render dynamic views
- dynamic view lifecycle hooks

Experimental features:
- type-explicit reactivity
- compile-time mutation safety checking that prevents accidental, hidden mutations while allowing statically traceable mutable bindings
- language extension of TypeScript + JSX for improved readability and type safety of signal-based reactivity (see [NextScript](https://github.com/ruby-cube/luent/blob/main/packages/nextscript#nextscript))

<br>

> **This project is in early development.** Most core client-side functionality is working and relatively stable, but bugs, rough edges, and some amount of experimental churn should be expected.


<br>

## Code Examples
Take a tour of Luent's syntax and APIs with these [code glimpses]() and [demos]().


<br>

## Motivation
Modern frameworks bring powerful innovations to web development, but often introduce cognitive overhead through syntax, abstractions, and patterns that run counter to native web technologies and developer intuition.

This project explores ways to make development of complex, evolving applications more intuitive and ergonomic without trading off performance or scalability.

<p align="right"><a href="#readme-top">[top]</a></p>


## JSX Transpiler

Luent transpiles JSX into `jsx()` call expressions with straightforward mental mapping between JSX syntax and compiled output. It extends the base JSX transform with the following:
- JSX slots (known as `children` in classic JSX) are normalized to JSX array factories so that parent nodes may be created before their descendants
- [JSX flow expressions](http://luent.dev/guide/template-control-flow) (JSX call expressions that form a control flow series) are compiled into a single series node. This could be done at runtime, but Luent takes care of this at compile time to reduce runtime overhead
- JSX flow expression slots (the final argument of a JSX flow expression) are also normalized to JSX array factories
- JSX fragments are transformed into arrays

This JSX template ...
```jsx
<>
  <h1>Home</h1>
  <Parent foo={foo} bar={bar()} on:click={logClick}>
    <Child />
    {If(active, 
      <div class='msg'>Hello world! - {name}</div>
    )}
    {Else(
      <div class='msg'>zzzzzz</div>
    )}
  </Parent>
</>
```

... essentially maps to:
```jsx
[
  jsx('h1', { Slot: () => ['Home']}),
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
]

```


<p align="right"><a href="#readme-top">[top]</a></p>

## Roadmap

This project is early-stage. The current goal is to establish intuitive and expressive APIs that enhance developer productivity and application maintainability.

Once the API stabilizes, development will increasingly focus on runtime efficiency, tree-shakability, smaller bundle sizes, and shifting more work from runtime to compile time.

### Completed
- Core client-side functionality
- npm package
- CLI

### In progress
- API refinement and stabilization
- NextScript transpiler and language services
- Mutation safety
- Async rendering
- Animation and transition APIs
- Debugging tools
- Documentation
- Server-side rendering
- Interactive islands

### Planned: Framework features
- Scoped styles
- Client-side routing
- Async context

### Planned: Tooling and developer experience
- Improved dev warnings
- HMR refinement
- Playground

### Planned: Runtime and performance
- Performance optimizations
- Smaller bundle sizes
- Compiler-assisted tree-shaking



<p align="right"><a href="#readme-top">[top]</a></p>



## Prior Art

This project builds upon ideas pioneered by frameworks that have shaped modern web development. It draws inspiration from the consistency of React, the intuitiveness of Vue, the aesthetics of Svelte, the insightfulness of Solid, and the thoroughness of Angular.

Particular acknowledgement to the people and projects I've especially admired:

- Vue 3, the framework I fell in love with and that sparked my fascination with frontend frameworks. Its accessor-based reactivity and seeds of fine-grained reactivity heavily influenced Luent's reactivity system.
- Solid.js, which provided insight particularly in how to approach component props and derivations in a signals-based framework
- Ryan Carniato, whose articles and streams have been an encouraging source of clarity and affirmation
- Evan You and the Vue team, whose dedication to developer experience has greatly informed how I approach designing Luent


<p align="right"><a href="#readme-top">[top]</a></p>

## License
[MIT license](https://github.com/ruby-cube/luent/blob/main/LICENSE)
