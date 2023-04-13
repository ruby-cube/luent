#### [goto: src](https://github.com/ruby-cube/rue)
<p align="center">
  <img width="240" src="https://github.com/ruby-cube/rue/blob/main/rue-logo%403x.png" alt="rue logo"/>
</p>

# Rue

<aside style="background-color: #444">
⚠️ <b>Experimental:</b> The projects in this repo are works-in-progress, not well-tested, with volatile APIs. Look and play, but definitely don’t use…
</aside>
<br/>
<br/>

## Overview

Rue.js is a collection of tools I created in the process of building a fairly complex app. These Typescript-enhanced tools aim to support maintainability and extensibility as an app becomes more complex and thus more prone to scattered logic and tight coupling of unrelated modules. 

The repo contains the following categories: Event-driven/asynchronous programming, data management, control flow, and Vue reactivity.

<br/>

## Demo

*(coming eventually)*

<br/>

## The Tools

***Event-driven Programming***

[**🪶 Planify**](https://github.com/ruby-cube/rue/tree/main/packages/planify#goto-src)
<br/>
An event system designed to make asynchronous, event-driven programming more clean, readable, and less prone to memory leaks.

[**🐟 Pêcherie**](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src)
<br/>
Creates targeted and untargeted events/hooks.

[**🏹 Archer**](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src)
<br/>
Sends and receives targeted messages/commands.

[**⏳ Thread**](https://github.com/ruby-cube/rue/tree/main/packages/thread#goto-src)
<br/>
Provides planified versions of schedulers and event listeners from Web API.

[**🌴 Paravue**](https://github.com/ruby-cube/rue/tree/main/packages/paravue#goto-src)
<br/>
Provides planified versions of Vue’s `watch` and `computed`, component utils, and reactivity markers.

**🥀 Ephemr**
<br/>
*(coming soon-ish)* Creates state machines using planified events and hooks

<br/>

***Data Management***

[**🪴 Être**](https://github.com/ruby-cube/rue/tree/main/packages/etre#goto-src)
<br/>A system of composition for rich domain models

**🔔 Modos**
<br/>
*(coming soon-ish)* An in-memory data model store that leverages Vue’s reactivity system. Particularly useful for tree structures. Includes several optional modules:
- **Revive**: normalize and denormalize data
- **Vine**: two-way tree structure
- **Persistence**: batches changes for calls to the database
- **History**: batches changes for undo/redo

<br/>

***Control Flow***

**🔱 Nautic**
<br/>
*(coming soon-ish)* Compile control flow maps for complex control flows.

**⛵ Voile**
<br/>
*(coming soon-ish)* Compositional control flow for making complex control flows more efficient.

<br/>

***Vue Ecosystem***

[**🌴 Paravue**](https://github.com/ruby-cube/rue/tree/main/packages/paravue#goto-src)
<br/>
Provides planified versions of Vue’s `watch` and `computed`, component utils, and reactivity markers.

**🎬 Actionry**
<br/>
*(coming soon-ish)* Define actions. Useful for batching reactive effects based on actions.

<br/>

## Compatibility

While most of the tools are theoretically framework-agnostic, they were built with Vue 3 in mind and have not been tested with other frameworks. Note that since Vue 3 reactivity is decoupled from the Vue component framework, tools that leverage Vue 3's reactivity system can be use outside of Vue apps. That said, I highly recommend the Vue component framework for its clarity of concepts and thoughtful design.

Typescript is highly encouraged for less headaches when defining types.

<br/>

## The `$type` variable

Many of the functions in this repo take in configurations that are purely for typing purposes. If using pure Javascript, you can pass in an object or primitive that satisfies the type definition, for example: 

```tsx
const [castMounted, onMounted] = createHook({
    data: { id: "" }, // enables type hints
});

onMounted((data) => {
    data // type hint: { id: string }
});
```

However, to make it explicit that the argument is a type definition, Rue utils provides a special `unknown`-typed variable, `$type`, that can be cast into any type you need. 

This convention opens the opportunity to remove the argument or config property at build time for leaner shipped code. 

```tsx
import { $type } from "@rue/utils";

const [castMounted, onMounted] = createHook({
    hook: "mounted",
    data: $type as { id: string }, // enables type hints
});

// can theoretically transform to: (...once I've built the plugin)
const [castMounted, onMounted] = createHook({
    hook: "mounted",
});
```
<br/>

## Contribution
I'm currently not looking for code contributions. However, I'm completely new to open source and would appreciate guidance from experienced open source maintainers.

I'm also relatively new to software engineering itself and have been learning and building in isolation, so although I've done extensive research and have reasons for the decisions I've made in these projects, to be quite honest, I can't really tell how naive my solutions may be, from sheer lack of experience. Thoughts and gentle feedback from more experienced devs would be appreciated.

Send a note to my gmail: ruby (dot) yiong. I would especially love to connect with someone in the Seattle area, though help from anywhere in the world would be appreciated too.

<br/>

## Inspiration

[**Vue.js**](https://vuejs.org/)

I am heavily influenced and greatly inspired by Vue and its brilliant, elegant, and intuitive design, especially Vue 3’s Composition API. Vue is also how I was introduced to the concept of emitting events and lifecycle hooks. It was such a fascinating concept to me that I began exploring ways to emit my own hooks outside of the Vue framework, which led to the various event systems in this repo.

<br>

[**Quill**](https://quilljs.com/)

The Quill docs and codebase opened my eyes to how beautiful and poetic an open source codebase can be without compromising the end product. I previously felt I had to suppressed the urge to write poetic code. Quill helped me realize that as long as it doesn’t impede clarity and I’m working on my own project… why not? :)

<br/>

## Jiufen

Perusing a complex codebase, with its myriad paths of connection, is perhaps like wandering the labyrinthine lantern-lined walkways and underground tunnels of [Jiufen](https://www.nationalgeographic.com/travel/article/exploring-the-magic-of-taiwans-spirited-away-city). What you find is confusing and chaotic, astonishing and magical, yet somehow built on logic.

<br/>
<br/>

[[top]](https://github.com/ruby-cube/rue#goto-src)

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
