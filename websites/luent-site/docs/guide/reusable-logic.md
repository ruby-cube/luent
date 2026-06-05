# Reusable Logic
As applications grow, components often need to share the same stateful behavior. Rather than rewriting similar logic across multiple components, logic may be extracted and composed independently of components. This makes logic easier to reuse, test, and maintain.

## Stateful Kits
Stateful kits are reusable and composable units of stateful logic. They can encapsulate reactive state, methods, derivations, effects, and cleanup behavior, while remaining simple to consume through destructuring.

### Defining a stateful kit

```tsx
export function CounterKit(startCount: number) {
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

### Using a stateful kit
```tsx
import { CounterKit } from "./CounterKit"

function App() {
   const { count@, incrementCount, decrementCount } = CounterKit(0)
   
   <Component>
      <div>
         <div>{count@}</div>
         <button on:click={incrementCount}>+</button>
         <button on:click={decrementCount}>-</button>
      </div>
   </Component>
}
```

## Classes and Reactivity
Reusable stateful logic may also be defined through JavaScript classes and made reactive through Luent's `ionic()`, which implements reactivity through proxies.

```tsx
export class Box {
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

```tsx
import { Box } from "./Box"

function App() {
  const box = ionic(new Box(0, 100))

  <:component>
    <div 
      class="box" 
      style={(`transform: translate(${box.x}px, ${box.y}px)`)@}
    ></div>
    <button on:click={box.moveLeft}>◀</button>
    <button on:click={box.moveRight}>▶</button>
    <button on:click={box.moveDown}>▼</button>
  </:component>
}
```

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

To configure reactivity for user-defined or third-party library classes with private state, see the [custom reactivity guide]().

### Manual reactivity
While custom reactivity configuration addresses some proxy limitations, there are two main limitations that require a different approach. These are implementations that:

- involve identity checks that mix proxies and raw targets, causing incorrect control flow.
- prevent `this` from referring to the reactive proxy.

Such classes must either be:
- rewritten with an implementation that avoid these pitfalls
- or wrapped in a manual non-proxy reactivity implementation

For example, `Counter` below is problematic for proxy-based reactivity because `this` in `decrement` can never refer to the reactive proxy:
```tsx
class Counter {
  count = 0

  constructor() {
    this.decrement = () => {
      this.count--
    }
  }

  increment() {
    this.count++
  }
}

const counter = ionic(new Counter())

counter.increment() // reactivity works
counter.decrement() // X reactivity fails--`this` is the raw target
```

**Solution A: Re-implement**
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
counter.decrement() // reactivity works
```

**Solution B: Wrap with manual reactivity**

```tsx
class IonicCounter {
  private counter = new Counter()
  private core = IonCore()

  get count() {
    this.core.track('[[get]]', 'count');
    return this.counter.count
  }

  decrement() {
    this.core.trigger('[[get]]', 'count')
    this.counter.decrement()
  }

  increment() {
    this.core.trigger('[[get]]', 'count')
    this.counter.increment()
  }
}

const counter = new IonicCounter();

counter.increment() // reactivity works
counter.decrement() // reactivity works
```
See the __custom reactivity guide__(planned).