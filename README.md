<div align="center">
<picture>
  <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/assets/luent-logo-site-ambicolor.png" alt="luent-logo"/>
</picture>
<p><a href='https://nextscript.org/getter-syntax'>learn</a> &nbsp;&nbsp;-&nbsp;&nbsp; <a href='https://nextscript.org/examples'>play</a> &nbsp;&nbsp;-&nbsp;&nbsp; <a href='#motivation'>motivation</a> &nbsp;&nbsp;-&nbsp;&nbsp; <a href='#design-principles'>principles</a>
</div>

# Luent
Luent is a web application framework that aims to bring greater conceptual coherence to the complexities of modern web development. It consists of a fine-grained reactivity system, DOM manipulation engine, and JSX transpiler, all written from scratch with much tender loving care and obsessive experimentation. The project also introduces [NextScript](https://github.com/ruby-cube/luent/blob/main/packages/nextscript#nextscript), an optional TypeScript + JSX language extension designed to improve the readability, ergonomics, and type safety of signal-based reactive code.

> **This project is in early development.** Most standard client-side functionality is already working and relatively stable, but bugs, rough edges, unhandled cases, and some amount of experimental churn should be expected. We have yet to publish docs, an npm package, or CLI. In the meantime, Luent examples can be seen through this [code glimpse](#code-glimpse) and [NextScript demos](). 
>
> NextScript features have mostly been implemented but require substantial tooling work before the extension is usable. To get a sense of NextScript's syntax, check out these [code glimpses]() and [demos]().
>
> We'd love help getting this project off the ground. Learn how to [contribute](https://github.com/ruby-cube/luent/blob/main/CONTRIBUTING.md).


<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation
Modern frameworks have brought powerful innovations to web development. While these frameworks have significantly advanced the ecosystem, they also come with additional cognitive overhead, often through syntax, abstractions, and patterns that run counter to native web technologies and developer intuition. 

This project explores ways syntax and API design might improve the way we build modern web applications while minimizing complexity. The key challenge is understanding how far we can move toward simplicity without trading off conceptual integrity and technical rigor. 


<p align="right"><a href="#readme-top">[top]</a></p>

## Features
Luent currently provides most of the standard features expected of a modern frontend framework, with server-side features planned.

Core design features:
- a unified system of fine-grained reactivity through `ion()` and `ionic()`
- state management through familiar native structures
- selective, type-explicit reactivity
- traceable mutations to aid in debugging reactivity

Other notable features:
- a reactive finite state machine API via `Finitron`
- ergonomic asynchronous reactivity
- preservation of state and DOM nodes through a `'preserve'` directive or `<o:preserve>` tag

Experimental areas:
- [WIP] language extension of TypeScript + JSX for improved readability and type safety (see [NextScript](https://github.com/ruby-cube/luent/blob/main/packages/nextscript#nextscript))
- [WIP] compile-time mutation safety checks and statically traceable `mu:` bindings


<p align="right"><a href="#readme-top">[top]</a></p>

### Code Glimpse
The following Luent components are written in [NextScript](https://github.com/ruby-cube/luent/blob/main/packages/nextscript#nextscript) (.nsx), which compiles down to TypeScript + JSX. To see this example written in .tsx, see [EmojiQuest Demo]()
```tsx
function EmojiQuest() {
  const powers = ['🍀', '🍄', '✨'] as const
  const powerset = ionic(['🍀', '🍄', '✨'], {
    addPower() {
      this.push(powers[Math.floor(Math.random() * powers.length)])
    }
  })

  <::>
    <main>
      <EmojiGame {powerset}/>
    </main>
    <aside>
      <Panel title="Powerset">
        <Powerset 
          mu:powerset={powerset} 
          limit={10}
        />
      </Panel>
    </aside>
  </::>
}

function Powerset(setup: {
  'mu:powers': Ionic<string[]> & { 
    addPower(): void 
  }
  limit: number
}) {
  const { mu, limit, powers } = fromTag(setup);

  get count = powers.length@
  get remaining = ion(() => limit - count)

  <::>
    <div class='powerset-panel'>
      <ul>
        {For(powers, power =>
          <li class='power-chip'>{power}</li>
        )}
      </ul>

      <div class='panel-footer'>
        <button
          disabled={(count === limit)@}
          on:click={() => mu(powers).addPower()}
        >
          +
        </button>

        <div class='stats'>
          <span>Total</span>
          <span>{count@}/{limit}</span>
        </div>
      </div>

      <PowersetMessages 
        start={powers.length} 
        remaining={remaining@}
      />
    </div>

    <o-link href='/src/powerset.css' rel='stylesheet'/>  
  </::>
}

function PowersetMessages(setup: { 
  start: number; 
  remaining: Ion<number> 
}) {
  const { start, remaining@ } = setup

  <::>
    {If(remaining@,
      <div class='msg'>You have {remaining@} slots left.</div>
      <div class='msg'>You started with {start} powers.</div>
    )}
    {Else(
      <div class='msg'>Powerset complete.</div>
    )}
  </::>
}
```
```tsx
function Panel(setup: {
  title: string,
  Slot: RenderSlot
}) {
  const { title, Slot } = setup

  get opened = ion(true)

  <::>
    <div class='panel'>
      <div>{title}
        <button on:click={() => opened = !opened}>
          {(opened() ? '-' : '+')@}
        </button>
      </div>
      <div show-if={opened@}>{Slot}</div>
    </div>

    <o-style>
      .panel {
        width: 25vh;
        user-select: none;
      }
    <o-style>
  </::>
}
```
<p align="right"><a href="#readme-top">[top]</a></p>

### JSX Transpiler

Luent transpiles JSX into `jsx()` calls for straightforward mental mapping between JSX syntax and compiled output. It extends the base JSX transform with the following:
- JSX slots (known as `children` in classic JSX) are normalized to JSX array factories so that parent nodes may be created before their descendants, e.g. `<Parent><Child/></Parent>` → `jsx(Parent, { Slot: () => [jsx(Child)] })`
- [JSX flow expressions](http://luent.dev/guide/template-control-flow) (designated JSX call expressions that form a control flow series) are compiled into a single series node. This could be done at runtime, but Luent takes care of this at compile time to reduce runtime overhead.
- JSX flow expression slots (the final argument of a JSX flow expression) are also normalized to JSX array factories.
- `<o-style>` tags are transformed to a `style()` call with a string template literal argument
- JSX fragments are transformed into arrays

The following JSX template...
```jsx
<>
  <Parent foo={foo} bar={bar()} on:click={logClick}>
    <Child />
    {If(active, 
      <div class='msg'>Hello world! - {name}</div>
    )}
    {Else(
      <div class='msg'>zzzzzz</div>
    )}
  </Parent>
  <o-style>
    .msg {
      border: 1px solid gray;
    }
  </o-style>
</>
```

...essentially maps to:
```jsx
[
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
  }),
  style(`    
    .msg {
      border: 1px solid gray;
    }
  `)
]

```


<p align="right"><a href="#readme-top">[top]</a></p>



## Design Principles
Luent is being developed under these guiding principles, which encapsulate our values and how we navigate tradeoffs:

- **Human-centered, LLM-friendly.**
We take a human-centered approach, both in the development of this project and the framework design. The vision, creativity, and needs of humans are the driving force behind this project. AI plays a supporting role. We believe interfaces designed for human clarity also tend to work well with AI systems. By designing for humans first, we often create systems that are naturally LLM-friendly as well.

- **Elegance and simplicity.**
Elegance—both conceptual and syntactic—is central to Luent’s API design. We pursue simple solutions through extensive experimentation and relentless trimming of excess.

- **Intuitive mental models.**
Luent aims to be as invisible as possible so developers can focus on application logic rather than framework mechanics. We strive to minimize mental code-switching by supporting mental models grounded in native web technologies and familiar programming fundamentals.

- **High-level abstractions.**
Abstractions should emphasize high-level concerns while minimizing exposure to underlying implementation details. We favor clear, descriptive terminology over low-level technical jargon.

- **Consistency over aesthetics.**
While aesthetics matter, the pursuit of visually elegant code should never introduce inconsistencies in the language or unpredictable magic. Clean syntax should emerge from carefully designed rules and principled syntactic sugar.

- **Clarity and expressiveness over brevity.**
Concise code is valuable, but not at the expense of basic clarity, flexibility, and type safety. Developers should never feel constrained by the framework for the sake of terseness or visual minimalism.

- **Elimination of bug-prone patterns.**
Luent should absorb as much repetitive and error-prone infrastructure as possible to reduce time spent debugging an application.

- **Pragmatic type safety.**
We strive to improve type safety whenever possible while also recognizing that manual solutions are sometimes preferable when the costs outweigh the benefits or TypeScript itself imposes limitations.

- **Quality over speed.**
Keeping up a reasonable pace is desirable, but quality should not be compromised for the sake of development speed. 

- **Great user experiences.**
All of this ultimately serves the end user. We embrace build steps as they allow us to improve developer ergonomics without compromising runtime performance. We prioritize expressiveness and stability in our framework design because they form the foundation developers rely on to build, evolve, and maintain great user experiences. A solid framework → good DX → great UX.


<p align="right"><a href="#readme-top">[top]</a></p>


## Prior Art

This project builds upon ideas pioneered by frameworks that have shaped modern web development. It draws inspiration from the consistency of React, the intuitiveness of Vue, the aesthetics of Svelte, the insightfulness of Solid, and the thoroughness of Angular.

Particular acknowledgement to the people and projects I've especially admired:

- Vue 3, the framework I fell in love with and that sparked my fascination with frontend frameworks. Its accessor-based reactivity and seeds of fine-grained reactivity heavily influenced Quarky (Luent's reactivity system).
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
