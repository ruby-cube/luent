<nav><a id="readme-top" href="#"><b>goto: src</b></a></nav>

[@rue](https://github.com/ruby-cube/rue#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp;  [paravue](https://github.com/ruby-cube/rue/tree/main/packages/paravue#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; [watch](https://github.com/ruby-cube/rue/tree/main/packages/watch#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; **signals**  &nbsp;&nbsp;|&nbsp; &nbsp; actionry

# Signals 🕊️

<aside>
⚠️ <b>Experimental:</b> Rue Signals is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…
</aside>

<p align="right"><a href="#">[src]</a></p>

## Overview
Rue Signals aims to bring more consistency, clarity, and selectivity to reactivity in Vue apps by exposing a signal-based API. Built on top of Vue’s shallow ref and computed ref.

<p align="right"><a href="#">[src]</a></p>

## Installation

```bash
(coming soon ...)
```

<p align="right"><a href="#">[src]</a></p>

## Motivation

I have loved working with Vue 3’s reactivity system in my apps over the past year. Its flexibility, fine-grained reactivity, and clarity of concepts immediately won me over when I was exploring various Javascript frameworks. Vue’s reactivity system presents a nice, clean interface for developers by keeping reactive signals under the hood via getters and setters.

However, due to limitations of the Javascript language (that is to say, because variables cannot have getters and setters), implementing reactivity through hidden getters and setters necessitates two slightly different reactivity access models: one for reactive variables and one for reactive properties. This creates a sort of inconsistency, which in turn has led to some recurring pain points in the developer experience that have at various times been acknowledged in Vue forums as well as in the Vue docs itself:

- refs require an extra layer of verbosity to access and assign values (i.e. `.value` )
- developers don’t always remember to add `.value`, leading to time spent debugging
- due to ref auto-unwrapping in the template, ref access in scripts vs templates are inconsistent, contributing to the confusion
- reactivity is lost when a reactive object is destructured, an unexpected behavior for those not well-versed in Vue’s reactivity system
- destructuring a reactive object using `toRefs` requires a mental switch from “these are reactive properties that can be accessed directly” to “these are now refs and have a `value` property”

While these aren’t necessarily issues for the developer who’s versed in Vue’s nuances, they may pose as obstacles for developers new to Vue or who work with multiple frameworks across different projects.

Rue Signals explores how exposing signals as an interface (rather than keeping them hidden) can alleviate these issues by offering a more consistent handling of reactive variables and properties, eliminating the need for conversions and mental switches, as well as by making reactivity more explicit and therefore less unexpected.

There are, of course, tradeoffs with this approach: The concept of signals adds an additional layer of complexity over the concept of reactivity, and creating consistency across reactive variables and properties requires a sort of middle-ground level of verbosity. However, both of these serve to add clarity and uniformity to the reactivity system, improving maintainability in the long run. Above all, a consistent and unified model for reactive references will hopefully create more ease in the developer experience.

<p align="right"><a href="#readme-top">[top]</a></p>

## Inspiration

This library stands on the shoulders of giants. It is a mere tweaking of existing APIs and concepts from [Vue.js](https://vuejs.org/guide/extras/reactivity-in-depth.html), [Solid.js](https://www.solidjs.com/guides/reactivity), and [Angular](https://angular.io/docs). Vue’s documentation already lays out how to create signals from Vue refs [here](https://vuejs.org/guide/extras/reactivity-in-depth.html#connection-to-signals).

<p align="right"><a href="#readme-top">[top]</a></p>

## Table of Contents

<aside>
⚠️ <b>Note:</b> These docs use faux TS type definitions that aren’t actual usable TS types. They are simplified types for the purpose of clarity.
</aside>
</br>
</br>

- Concepts
    - [Signals](#signals)
    - [Reactive References](#reactive-references)
    - [Explicit Reactivity](#explicit-reactivity)
- [Basic Examples](#basic-examples)
- [Signals API](#signals-api)
- [Vue Counterparts](#vue-counterparts)
- [Reactivity in Iterables](#reactivity-in-iterables)
- [Tips](#tips)
- [Performance Optimization](#performance-optimizations)

<p align="right"><a href="#readme-top">[top]</a></p>

## Signals

Different frameworks have different approaches to the concept of a signal. In this library, a signal is a function that serves conceptually as:

- an interface representing a reactive reference
- an accessor that returns the current value of the reactive reference
- a signaler that informs the reactivity system when the reactive reference is being accessed or assigned a new value

### Type Definition

```tsx
type Signal<T> = () => T // returns the current value of the reactive variable/property
```

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Reactive References

Reactive references is the concept encompassing both reactive variables and reactive properties.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Explicit Reactivity

Signals as functions are inherently explicit about reactivity. However, this library makes reactive references even more explicit with the suffix -`$`. The `$` can be thought of as representing the word "signal".

While variable names should generally focus on the problem domain and avoid including implementation details such as types, there is a case to be made that making reactivity explicit in variable names can aid in making code easier to understand and maintain, particularly since reactivity is not the native, expected behavior of JavaScript.

I have personally found it less confusing and faster to work in codebases that employ some form of Hungarian notation to indicate reactivity. Before you balk and walk away, consider that a reactivity marker makes it easier to:

- distinguish at a glance between reactive and non-reactive variables/properties
- see at a glance where reactivity is happening
- immediately know you’re working with a reactive reference without having to hover for a type definition from your IDE
- reduce the likelihood a developer will forget to treat the reference as a signal
- work cleanly with both a signal and its value within the same scope. For example:
    
    Code without reactive markers ends up being more verbose here:
    
    ```tsx
    const word = $("type here...");
    ```
    
    ```tsx
    const _word = word();
    if (_word === "type here...") {
       // do something
    }
    else if (_word === "") {
       // do something else
    }
    ```
    
    Code with reactive markers looks cleaner here:
    
    ```tsx
    const word$ = $("type here...");
    ```
    
    ```tsx
    const word = word$();
    if (word === "type here...") {
       // do something
    }
    else if (word === "") {
       // do something else
    }
    ```
    
- distinguish between method calls and reactive property access in some rare cases. For example, is `range.end()` a method call that ends the range or is it accessing the end value of the range? Context would help of course, but it’s faster to see `range.end()` and `range.end$()` and know automatically what’s happening in each case.
- keep the door open to potential compile-time performance optimizations (provided that the `$` suffix is reserved as a reactivity marker in the codebase)

This is largely a matter of preference. The `$` suffix makes code less clean and maybe less readable, but for those like me, it makes code faster to work with, less bug-prone, and more immediately understandable despite the eyesore, which makes it a worthwhile tradeoff.

While this library does not (currently?) enforce this convention for the naming of reactive variables, the object-signalizer functions enforce reactivity markers on reactive properties by appending a `$` to the property key.

That said, if you need to expose properties to an external consumer that does not need to know about its reactive implementation, you should expose an object containing getters and setters rather than the object containing signals and reactivity markers.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Basic Examples

Creating a signal and computed signal

```tsx
const count$ = $(0);

const doubleCount$ = computed$(() => count$() * 2 );
```

Setting the value:

```tsx
// set value
$set(count$, 4); // 4
const doubleCount = doubleCount$(); // 8

// set via manipulator
$set(count$, (count) => count + 1); // 5
```

Creating a signal for a reactive array:

```tsx
const items$ = $(["apple", "peaches", "pears"]);
```

Mutating:

```tsx
$mutate(items$, (items) => { items.push("plums") });  // ["apple", "peaches", "pears", "plums"]
```

Create an object whose properties are reactive:

```tsx
const position = signalize({
    x: 0,
    y: 0,
});

const coordinates$ = computed$(() => position.x$() + ", " + position.y$());
```

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Signals API

**Core signal creators and setters**

[$()](#)

[computed$()](#computed)

[$set()](#set)

[$mutate()](#mutate)

**Convenience signal creators**

[signalize()](#signalize)

[deepSignalize()](#deepsignalize)

[signalize$()](#signalize-1)

[deepSignalize$()](#deepsignalize-1)

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `$()`

Creates a signal. `$` can be pronounced “signal for”. Analogous to Vue’s `shallowRef()`.

### Syntax

```tsx
const reactiveReference$ = $(initialValue);
              |                   |   
            Signal               any        
```

### Usage

```tsx
const count$ = $(0);

const doubleCount$ = computed$(() => count$() * 2 ); // reactive tracking
```

```tsx
$set(count$, 4) // reactive effect
```

### Shallow Reactivity

Signals generated by `$()` are shallowly reactive. If you pass in an object, none of the object’s properties will be reactive; only the object reference (e.g. `position$`) is reactive.

```tsx
const position$ = $({
    x: 0,
    y: 0,
});

const x$ = computed$(() => position$().x.toString()) // no reactive tracking of x

position$().x = 1 // no reactive effects
```
To make all direct properties reactive, use [signalize$()](#signalize-1). If you don’t need a reactive reference to the object itself, use [signalize()](#signalize).

### Selective Nested Reactivity

Shallow reactivity makes it possible to choose which properties to make reactive.

```tsx
const position$ = $({
    id: genID(),  // non-reactive property
    x$: $(0),  // reactive property
    y$: $(0),  // reactive property
})

const coordinates$ = computed$(() => position$().x$() + ", " + position$().y$());

$set(position$().x$, 1);
```

Note that when working with selective nested reactivity, setting the value of `position$` above requires manually indicating nested reactive properties. This differs from the auto-nested-reactivity that happens when setting the value of a Vue ref or a [signalized signal](#signalizeobject-1).

```tsx
// preserves nested reactivity
$set(position$, {
    id,
    x$: $(x),
    y$: $(y)
});

// loses nested reactivity
$set(position$, {
    id,
    x,
    y
});
```

In cases like these, I recommend writing a factory function for objects with nested reactive properties:

```tsx
function createPosition({x, y}){
    return {
        id: genID(),
        x$: $(x),
        y$: $(y)
    };
}

const position$ = $(createPosition({
    x: 0,
    y: 0
}));

$set(position$, createPosition({
    x: 3,
    y: 4
}));
```

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `computed$()`

Creates a read-only signal for a computed variable or property. Pronounced “computed signal”. A wrapper around Vue’s `computed()`.

### Syntax

```tsx
const reactiveVariable$ = computed$(computation);
              |                        |
        ComputedSignal             () => any          
```

### Usage

```tsx
const count$ = $(1);

const doubleCount$ = computed$(() => count$() * 2 ); // reactive tracking

doubleCount$(); // 2

$set(count$, 4);

doubleCount$(); // 8
```

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `$set()`

Sets the value of a reactive property or variable (represented by a signal) and signals to the reactivity system if a value change has occurred. Returns the new value for convenience. Pronounced “signaled set.”

### Syntax

```tsx
const newValue = $set(signal, value);
         |              |       |
         T         Signal<T>    T
```

```tsx
const newValue = $set(signal, manipulator);
         |              |           |
     Primitive          |       (value: Primitive) => Primitive
                Signal<Primitive>
```

### Usage

```tsx
const count$ = $(1);

const doubleCount$ = computed$(() => count$() * 2 );

function demoStuff() {
    doubleCount$(); // 2

    $set(count$, 4); // triggers reactive effects

    doubleCount$(); // 8
}
```

Setting via a manipulator:

```tsx
const count = $set(count$, (count) => count + 1 );

if (count > 10) {
    // do something
}
```
Note that manipulators can only be used if the value is a primitive. Use `$mutate` for reference values such as objects, arrays, and maps.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `$mutate()`

Mutates any mutable data structure stored in a reactive reference (represented by a signal) and signals to the reactivity system that change has occurred. It returns the value of the reactive reference for convenience. Pronounced “signaled mutate.”

### Syntax

```tsx
const mutated = $mutate(signal, mutator);
        |                  |       |
     Mutable     Signal<Mutable>   |
                                (value: Mutable) => void  
```

### Type Definitions

```tsx
type Mutable = Object | Array | Set | Map;
```

### Usage

```tsx
const items$ = $(["apple", "peaches", "pears"]);

function doSomething() {
    const items = $mutate(items$, (items) => { items.push("plums") });  // ["apple", "peaches", "pears", "plums"]

    if (items.length > 10) {
        // do something
    }
}
```

Note that the `$mutate` function passes the value of the reactive variable/property to the mutator, not the signal. Also note that `items` is not a modified clone. It is strictly equal to the original array passed into `$()`.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `signalize()`

Creates an object whose direct properties are reactive via signals. Appends the -`$` suffix to reactive keys. Analogous to Vue’s `shallowReactive()`

### Syntax

```tsx
const objectOfSignals = signalize(object);
            |                        |
  { [key: string]: Signal }   NonIterableObject
```

### Usage

```tsx
const position = signalize({
    x: 0,
    y: 0,
});

const coordinates$ = computed$(() => position.x$() + ", " + position.y$())

$set(position.x$, 1) // triggers reactive effects

```

Note that only a non-iterable object can be passed into signalize. Passing in an array, set, map, or primitive, will throw an error. (see [Reactivity in Iterables](#reactivity-in-iterables) for why the entries of iterables are not made into signals).

Note also that the position object itself does not have a reactive reference, only its properties. For a reactive reference to the object itself, use [signalize$()](#signalizeobject-1).

For a deeply reactive object where all properties of nested objects are made reactive, use [deepSignalize()](#deepsignalize).

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `deepSignalize()`

Creates an object whose properties (including nested properties) are reactive via signals. Appends the -`$` suffix to reactive keys. Analogous to Vue’s `reactive()`.

### Syntax

```tsx
const deepObjectOfSignals = deepSignalize(object);
              |                              |
  { [key: string]: Signal }           NonIterableObject
```

### Usage

```tsx
const position = deepSignalize({
    x: 0,
    y: 0,
    prevPosition: {
        x: 0,
        y: 0,
    }
});

// reactive tracking of x
const prevCoordinates$ = computed$(() => {
    const prevPos = position.prevPosition$();
    return prevPos.x$() + ", " + prevPos.y$();
}) 

// trigger reactive effects
$set(position.prevPosition$().x$, 1) 

$set(position.prevPosition$, { x: 1, y: 9 })

```

Note that while properties of nested objects will be made reactive, entries of iterables like arrays, sets, and maps will not be “signalized”. See [Reactivity of Iterables](#reactivity-in-iterables) for why entries of iterables are not made into signals.

Note also that the object reference (`position` in the above example) is not a reactive. To make the object variable reactive along with all its properties and nested properties, use [deepSignalize$()](#deepsignalize-1).

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `signalize$()`

Creates a signal for a shallowly reactive object.  Appends the -`$` suffix to reactive keys. Pronounced “signalize signal of”. Analogous to calling `shallowRef(shallowReactive(object))` in Vue.

### Syntax

```tsx
const reactiveVariable$ = signalize$(object);
              |                        | 
           Signal               NonIterableObject
```

### Usage

```tsx
const position$ = signalize$({
    x: 0,
    y: 0,
});

const x$ = computed$(() => position$().x$().toString()) // reactive tracking of x

$set(position$().x$, 1) // triggers reactive effects
```

As with a Vue ref, which will thoughtfully auto-wrap the object in a `reactive`, `$set` will auto-wrap the value in `signalize` (if not already) if the signal was initialized with `signalize$()`.

```tsx
$set(position$, {
    x,
    y,
});
```

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `deepSignalize$()`

Creates a signal for a deeply reactive object.  Appends the -`$` suffix to reactive keys. Pronounced “deep signalize signal of”. Analogous to Vue’s `ref()`.

### Syntax

```tsx
const reactiveVariable$ = deepSignalize$(object);
              |                             |
            Signal                   NonIterableObject
```

### Usage

```tsx
const position$ = deepSignalize$({
    x: 0,
    y: 0,
    prevPosition: {
        x: 0,
        y: 0,
    }
});

// reactive tracking of x
const prevX$ = computed$(() => position$().prevPosition$().x$().toString()) 

// trigger reactive effects
$set(position$().prevPosition$().x$, 1) 

```

As with a Vue ref, which will thoughtfully auto-wrap the object in a `reactive`, `$set` will auto-wrap the value in `deepSignalize` (if not already) if the signal was initialized with `deepSignalize$()`.

```tsx
$set(position$, {
    x,
    y,
    prevPosition: {
        x: 0,
        y: 0,
    }
});
```

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Vue Counterparts

Here is a quick chart of how the Signal API corresponds to Vue’s API:

| Signal API | Vue API |
| --- | --- |
| `$(initialValue)` | `shallowRef(initialValue)` |
| `signalize(object)` | `shallowReactive(object)` |
| `deepSignalize(object)` | `reactive(object)` |
| `signalize$(object)` | `shallowRef(shallowReactive(object))` |
| `deepSignalize$(object)` | `ref(object)` |
| `computed$(computation)` | `computed(computation)` |
| `$set(signal, value)` | e.g. `myRef.value = value` |
| `$mutate(signal, mutator)` | e.g. `myRef.value.push(item); triggerRef(myRef);` |

Note: Rue Signals does not recommend replacing Vue’s template refs with signals. In fact, it’s helpful to have a distinction between reactive state and a reactive container for DOM and component nodes.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Tips

This library makes heavy use of the dollar sign in variable names. You may want to configure your IDE to include the dollar sign in word selections. How to in VSCode.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Reactivity in Iterables

A point of difference between `signalize` and Vue’s `reactive` is that `reactive` can make any type of object reactive, including iterables like arrays, sets, and maps. It seamlessly handles fine-grained reactivity with proxy handlers under the hood.

With Rue Signals, only basic non-iterable objects can have reactive properties. This limitation makes sense to some extent—iterables are dynamic structures that can grow and shrink, rather than rigid property schemas. Sets don’t even have indices or keys to serve as reactive references. Also, applying a signal interface to array indices and map access is just too awful:

```tsx
const items = signalize(["a", "b", "c"]);

items["0$"]() // oh god 🤢

const myMap = signalize(new Map([["dog", 🐶]]

myMap.get("dog$")() // ohh god why 🤮
```

Rue Signals’ current approach to iterables is to handle reactivity shallowly at the interface level to keep things looking clean. Under the hood, there is potential for performance optimizations through leveraging Vue’s `reactive` or some other proxy implementation for fine-grained reactivity.

```tsx
const items$ = $(["a", "b", "c"]);

const excitedFirstItem$ = computed$(() => items$()[0] + "!"); // simple access

$mutate(items$, (items) => items[2] = "d");  // simple assignment
```

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Performance Optimizations

As mentioned in the previous section, the Signals interface presents opportunities for optimizations under the hood. While currently a wrapper around Vue shallow refs, signals and the `$set` function could theoretically directly invoke the track and trigger functions for more efficiency. For signalized objects, there’s the opportunity for compile-time optimizations—perhaps by employing proxies instead of looping through each property. But for now, the current focus is to hash out an API that feels good to use.

<p align="right"><a href="#readme-top">[top]</a></p>

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)