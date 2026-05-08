<div align="center">
<picture>
  <img width="320" src="https://github.com/ruby-cube/luent/blob/cave/luent-logo-github-desaturated.png" alt="luent-logo"/>
</picture>
</div>

# Luent
Luent is a highly expressive web framework under active development. It consists of a fine-grained reactivity system, rendering engine, and JSX transpiler, all written from scratch with much tender loving care and obsessive experimentation. Luent also introduces NeoScript, an optional minimal syntactic language extension of Typescript and JSX designed to make writing reactive code more elegant and type-safe without employing magic or counter-intuitive mental models.

<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation
Modern frameworks bring powerful innovations to web development but often introduce their own cognitive overhead through specialized patterns that run counter to native technologies. This project explores how a framework's API design can minimize conceptual complexity and ergonomic friction by aligning with native syntax and behavior so developers can focus on application logic, instead of wrestling with the framework.

### Luent specially features
- an elegant, unified system of fine-grained reactivity that is consistent with native behavior
- simplicity in managing shared and centralized state through familiar native structures
- trackable and traceable mutations to aid in debugging reactivity


### Luent supports and encourages
- type safety
- readable dynamic templates
- encapsulation for clarity within complexity

<p align="right"><a href="#readme-top">[top]</a></p>

## Code glimpse

Here is some contrived code featuring API from Luent and syntax from NeoScript. For a more comprehensive overview of features in NeoScript as well as in plain TypeScript/JSX, see Luent at a glance.

#### In NeoScript
```tsx
function Counter() {

   get count = ion(0)
   get maxed = ion(() => count >= 100)

   <Component>
      <button 
         on:click={() => count++} 
         disabled={maxed@}
      >
         {count@}
      </button>
      {If(maxed@,
         <div class='celebrate'>🎊</div>
      )}
   </Component>
}
```

#### In TypeScript + JSX
(The $ prefix for getters is an encouraged convention, though not required.)

```tsx
function Counter() {

   const $count = ion(0)
   const $maxed = ion(() => $count() >= 100)

   <Component>
      <button 
         on:click={() => $count.value++} 
         disabled={$maxed}
      >
         {$count}
      </button>
      {If($maxed,
         <div class='celebrate'>🎊</div>
      )}
   </Component>
}
```

<p align="right"><a href="#readme-top">[top]</a></p>

## Status

Our current goal is to establish an intuitive and expressive API that feels pleasant to work with. Once the API is stable, we will focus on more efficient implementations and performance optimizations, such as treeshakability for smaller bundle sizes and moving work from runtime to compile time.

> This project is in early development. Standard client-side functionality is more or less stable, but expect bugs and uncovered edge-cases. See how to contribute here.


<p align="right"><a href="#readme-top">[top]</a></p>

© 2025 - present [Ruby Y Wang](https://github.com/ruby-cube)
