<div align="center">
<picture>
  <!-- <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/assets/luent-logo-padded.png" alt="luent-logo"/> -->
  <svg
   width="42.224327mm"
   height="42.224361mm"
   viewBox="0 0 42.224327 42.224361"
   version="1.1"
   id="svg1"
   xml:space="preserve"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg"><defs
     id="defs1" /><g
     id="layer1"
     transform="translate(-446.8216,624.67437)"><rect
       style="opacity:1;fill:none;fill-opacity:0.984314;stroke:none;stroke-width:2.46665;stroke-linejoin:round;stroke-dasharray:none;stroke-opacity:1"
       id="rect54-3-4"
       width="42.224342"
       height="42.224342"
       x="446.82159"
       y="-624.67432" /><path
       d="m 476.61211,-600.84153 c -1.01093,1.34008 -2.91917,1.60155 -4.26113,0.57929 l -0.008,-0.006 -4.23268,-3.22424 c -3.44546,-2.6246 -4.00623,-2.51792 -7.20273,-0.63115 l 7.48009,-4.4621 c 1.06001,-0.61446 2.38791,-0.52824 3.36827,0.21874 l -5.8e-4,-1.8e-4 c 0.01,0.007 0.0187,0.0137 0.0276,0.0208 l 4.22889,3.22137 0.004,0.004 c 1.3419,1.02219 1.60697,2.93933 0.59651,4.27961 z"
       style="fill:var(--fgColor-default, var(--color-fg-default));fill-opacity:1;stroke-width:0.904643;stroke-linejoin:round"
       id="path17-4-4-5-9-8-4-83-0-8-5-16-3-9-5-8" /><path
       d="m 467.53803,-598.46768 -5.9e-4,10e-5 c -1.03264,1.33887 -2.94831,1.59295 -4.27827,0.56806 -3.29687,-2.50855 -3.55665,-2.7062 -6.58834,-0.91539 l 6.86938,-4.10317 c 0.0207,-0.0135 0.0431,-0.0264 0.0649,-0.0391 l 5.8e-4,0.005 c 1.07261,-0.62936 2.41462,-0.54845 3.39479,0.20474 1.32991,1.02502 1.57092,2.94105 0.5381,4.27968 z"
       style="display:inline;fill:var(--fgColor-default, var(--color-fg-default));fill-opacity:1;stroke-width:0.904643;stroke-linejoin:round"
       id="path11-5-4-7-4-2-8-8-6-6-1-5-4-4-5-9-5-4" /></g></svg>
</picture>
<p><a href='https://nextscript.org/getter-syntax'>tour</a> &nbsp;-&nbsp; <a href='https://nextscript.org/examples'>demo</a> &nbsp;-&nbsp; <a href='#motivation'>motivation</a>
</div>

# Luent

Luent is a web framework designed around conceptual coherence, expressiveness, and clarity, with the aim of making complex, evolving applications easier to build, understand, and maintain.

It specially features: 
- a unified system of fine-grained, type-explicit, async-aware reactivity
- state management through familiar native structures
- compile-time mutation safety checking that prevents accidental, hidden mutations while allowing statically traceable mutable bindings

It embraces flexibility and aesthetics without losing sight of technical rigor.

<br>

> **This project is in early development.** Most standard client-side functionality is already working and relatively stable, but bugs, rough edges, unhandled cases, and some amount of experimental churn should be expected.


<br>

## Code Examples
Take a tour of Luent's syntax and APIs with these [code glimpses]() and [demos]().


<br>

## Motivation
Modern frameworks bring powerful innovations to web development, but often introduce cognitive overhead through syntax, abstractions, and patterns that run counter to native web technologies and developer intuition.

This project explores ways to make application development more intuitive and ergonomic without trading off performance or scalability.


<p align="right"><a href="#readme-top">[top]</a></p>

## Features
Luent currently provides the core capabilities expected of a modern web framework, including support for static site generation, server-side rendering, and building client-side interactivity.

Core design features:
- a unified system of fine-grained reactivity through `ion()` and `ionic()`
- state management through familiar native structures
- selective, type-explicit reactivity

Experimental areas:
- language extension of TypeScript + JSX for improved readability and type safety (see [NextScript](https://github.com/ruby-cube/luent/blob/main/packages/nextscript#nextscript))
- compile-time mutation safety checking and statically traceable `mu:` bindings


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
