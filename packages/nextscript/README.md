<div align="center">
<picture>
  <img width="200" src="https://github.com/ruby-cube/luent/blob/cave/packages/nextscript/assets/nextscript-logo-512px-padded.png" alt="nextscript-logo"/>
</picture>
<p><a href='https://nextscript.org/accessor-syntax'>learn</a> &nbsp;-&nbsp; <a href='https://nextscript.org/examples'>demos</a> &nbsp;-&nbsp; <a href='#motivation'>motivation</a> &nbsp;-&nbsp; <a href='#design-principles'>principles</a></p>
</div>

# NextScript

NextScript is an experimental TypeScript + JSX language extension designed to improve the readability, ergonomics, and type safety of UI templates and accessor-based reactive code. Its syntax is guided by [our language design principles](#design-principles).

> **This project is in early development.** Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable. To get a sense of the syntax, explore these [code glimpses](#code-glimpse) and [examples]().
>
> We'd love help getting this project off the ground. Learn how to [contribute]().

<p align="right"><a href="#readme-top">[top]</a></p>

## Motivation

Reactive UI programming and JSX have both been game changers in web development, turning complex UI updates into simple data bindings. However, JavaScript variables are not natively reactive, and existing solutions to making them reactive have their caveats. What initially seems simple and elegant often creates downstream complexity, conceptual overhead, and/or performance issues through implicit behaviors that do not always align with native JavaScript semantics or patterns.

Getter functions, popularized in the form of signals by Solid.js, show real promise as an explicit, performant conduit to reactivity in JavaScript. Unfortunately, getters have their own set of caveats, such as opaqueness to TypeScript type guards, the visual clutter of accessor function calls, or confusion caused by functions with data variable names.

On the templating side, JSX, though elegant in its syntactic rules, can quickly become unwieldy and difficult to read when indentation from fragments and nesting cumulate into indentation hell.

NextScript proposes to address these caveats with a dash of syntactic sugar.


<p align="right"><a href="#readme-top">[top]</a></p>


## Code Examples

Check out [code glimpses]() and [demos]() on [NextScript's site](https://nextscript.org). 


<p align="right"><a href="#readme-top">[top]</a></p>

## Design Principles

### Conceptual elegance and predictability
When language rules are simple and consistent, code is less bug-prone and less mentally taxing to read and write. As a language extension, NextScript strives to remain coherent with its foundational languages and preserve predictable behavior.

—

### Pragmatic syntactic elegance
NextScript prioritizes syntactic elegance that allows developers to read and write code with less friction, improving readability and developer ergonomics.

—

### Principled magic, not spookiness
NextScript introduces new syntax carefully, favoring explicitness whenever possible. It allows implicit behavior only when that behavior is locally deducible and provides sufficient ergonomic benefit to justify the added language complexity.

The goal is not to avoid magic altogether, but to avoid *unaccountable* magic: behavior that feels arbitrary, exceptional, or difficult to reason about.

<p align="right"><a href="#readme-top">[top]</a></p>


## Monospace font recommendations
Because NextScript makes use of an `@` postfix in its syntax, some developers may prefer fonts with a less visually dominant `@` glyph. Fonts that pair well with NextScript’s `@` syntax include:
- SF Mono (Apple’s system monospace font)
- Space Mono
- IBM Plex Mono
- Cascadia Mono
- JetBrains Mono
- Commit Mono
- Fira Code

<p align="right"><a href="#readme-top">[top]</a></p>

## License
[MIT license](https://github.com/ruby-cube/luent/blob/main/LICENSE)