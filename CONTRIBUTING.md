# Contributing to Luent
[coming soon]

<p align="right"><a href="#readme-top">[top]</a></p>

## Navigating the Monorepo
The Luent monorepo currently contains four key packages:
- luent - the core framework package
- @luent/quarky - the reactivity system
- @luent/flask - the batch cleanup and lifecycle manager
- @luent/noriscript - the TypeScript + JSX language extension

<p align="right"><a href="#readme-top">[top]</a></p>

## Monorepo Install Behavior
`pnpm install` only installs the current package by default. To bootstrap the entire workspace from the root folder, run:

```bash
pnpm run i:stable
```

## Design Principles
Luent is being developed under these guiding principles, which encapsulate the project's values and how tradeoffs are navigated:

- **Human-centered, LLM-friendly.**
We take a human-centered approach, both in the development of this project and the framework design. The vision, creativity, and needs of humans are the driving force behind this project. We believe that by designing for clarity and consistency, we create systems that are LLM-friendly as well.

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