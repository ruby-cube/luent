# Reusable Logic
As applications grow, components often need to share the same stateful behavior. Rather than rewriting similar logic across multiple components, logic may be extracted and composed independently of components. This makes logic easier to reuse, test, and maintain.

## Kits
Kits are reusable, composable units of application logic. They are headless counterparts to components, encapsulating reactive state, methods, derivations, reactions, and cleanup behavior while remaining decoupled from rendering.

Kits expose their reactive state and methods through plain objects, making them simple to consume through destructuring.

### Defining a kit factory

```tsx
function CounterKit(startCount: number) {
  get count = ion(startCount);

  function incrementCount() {
    count++
  }

  function decrementCount() {
    count--
  }

  return {
    count@,
    incrementCount,
    decrementCount
  }
}
```

### Creating a kit
```tsx
import { CounterKit } from "./CounterKit"

function App() {
  const { count@, incrementCount, decrementCount } = CounterKit(0)
  
  <:>
    <div>
        <div>{count@}</div>
        <button on:click={incrementCount}>+</button>
        <button on:click={decrementCount}>-</button>
    </div>
  </:>
}
```

## Classes and reactivity
Reusable stateful logic may also be defined through JavaScript classes and made reactive through Luent's `ionic()`.

### Key-value reactivity

As with object literals, `ionic()` will produce a reactive proxy of class instances that contain state in ordinary key-value pairs.

```tsx
class Box {
  constructor(
    public x: number,
    public y: number
  ) {
    this.x = startPosition.x;
    this.y = startPosition.y;
  }

  moveLeft() {
    this.x--
  }

  moveRight() {
    this.x++
  }

  moveDown() {
    this.y++
  }
}
```

```nsx
import { Box } from "./Box"

function App() {
  const box = ionic(new Box(0, 100))

  <:>
    <div 
      class="box" 
      style={(`transform: translate(${box.x}px, ${box.y}px)`)@}
    ></div>
    <button on:click={box.moveLeft}>◀</button>
    <button on:click={box.moveRight}>▶</button>
    <button on:click={box.moveDown}>▼</button>
  </:>
}
```

```tsx
import { Box } from "./Box"

function App() {
  const box = ionic(new Box(0, 100))

  return <>
    <div 
      class="box" 
      style={() => `transform: translate(${box.x}px, ${box.y}px)`}
    ></div>
    <button on:click={box.moveLeft}>◀</button>
    <button on:click={box.moveRight}>▶</button>
    <button on:click={box.moveDown}>▼</button>
  </>
}
```
<!-- 
### Classes with private state

As with object literals, `ionic()` can make class instances with ordinary key-value object structure reactive out of the box. 

However, due to proxy limitations, some classes require additional configuration to work with `ionic()`. 

This includes classes that:
- use private fields
- internally manage mutable collections
- rely on mutable state in closures
- rely on internal slots

Luent provides built-in reactive support for the following native JavaScript structures that fall into this category: `Array`, `Set`, `Map`, and `Date`.

```ts
const numbers = ionic([1, 2, 3])
const letters = ionic(new Set())
const map = ionic(new Map())
const date = ionic(new Date())
```

To configure reactivity for user-defined or third-party library classes with private state, see the **custom reactivity guide** (planned). -->

### Proxy limitations
Some classes require additional support to work with `ionic()` due to JavaScript `Proxy` limitations. These includes classes that:
  - define private state
    - use private fields
    - rely on mutable state in closures
  - involve identity checks that mix proxies and raw targets, causing incorrect control flow.
  - prevent `this` from referring to the reactive proxy.

These limitations are addressed through built-in support from Luent for native JavaScript structures and a manual reactivity API.

### Built-in reactive support
Luent provides built-in reactive support for the following native JavaScript structures: `Array`, `Set`, `Map`, and `Date`.

```ts
const numbers = ionic([1, 2, 3])
const letters = ionic(new Set())
const map = ionic(new Map())
const date = ionic(new Date())
```


### Manual reactivity

User-defined classes that are incompatible with `Proxy` must either be:
- reimplemented without `Proxy` pitfalls
- reimplemented with manual reactivity
- wrapped in a manual reactivity implementation

Third-party library classes must be:
- wrapped in a manual reactivity implementation

##### Example
`Counter` below is problematic for `Proxy`-based reactivity because `this` in `increment` and `decrement` can never be bound to the reactive proxy since the arrow function already binds it to the `Counter` instance.
```tsx
class Counter {
  count = 0

  constructor() {
    this.increment = () => {
      this.count++
    }
    this.decrement = () => {
      this.count--
    }
  }
}

const counter = ionic(new Counter())

counter.increment() // X reactivity fails--`this` is the raw target
```

**Solution A: Re-implement without problematic pattern**
```tsx
class Counter {
  count = 0

  increment() {
    this.count++
  }

  decrement() {
    this.count--
  }
}

const counter = ionic(new Counter())

counter.increment() // reactivity works
```

**Solution B: Re-implement with manual reactivity**

In cases where the `Proxy`-incompatible pattern is necessary, reactivity can be implemented manually using `Reactivity()`, `emitTrack()` and `emitTrigger()`.

```nsx
class Counter {
  private [Reactivity.key] = Reactivity()

  get count = ion(0);

  constructor() {
    this.increment = () => {
      this.count++
    }
    this.decrement = () => {
      this.count--
    }
  }
}

const counter = ionic(new Counter());

counter.increment() // reactivity works
```

```tsx
class Counter {
  private [Reactivity.key] = Reactivity()

  #count: number = 0

  get count() {
    emitTrack(this, '[[get]]', 'count');
    return this.#count
  }

  set count(value: number) {
    this.#count = value
    emitTrigger(this, '[[get]]', 'count')
    return value;
  }

  constructor() {
    this.increment = () => {
      this.count++
    }
    this.decrement = () => {
      this.count--
    }
  }
}

const counter = ionic(new Counter());

counter.increment() // reactivity works
```



**Solution C: Wrap with manual reactivity**

In cases where the class cannot be re-implemented, it may be wrapped with manual reactivity in a new class.

```tsx
class Counter {
  private counter = new ThirdParty.Counter()
  private [Reactivity.key] = Reactivity()

  get count() {
    emitTrack(this, '[[get]]', 'count');
    return this.counter.count
  }

  decrement() {
    this.counter.decrement()
    emitTrigger(this, '[[get]]', 'count')
  }

  increment() {
    this.counter.increment()
    emitTrigger(this, '[[get]]', 'count')
  }
}

const counter = ionic(new Counter());

counter.increment() // reactivity works
```
