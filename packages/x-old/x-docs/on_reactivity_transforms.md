


## Reactive Syntactic Sugar Proposal

With getters and setters established as reactive conduits, I envision a superset of JavaScript that allows using the `get` keyword to declare a variable with underlying getters and setters. The variable must be assigned a value satisfying the type interface of `<T>() => T`.

```ts
get count = ion(0)

// compiles to:
const $count = ion(0)
```

### State access
As with getters and setters on objects, the variable would return whatever the function assigned to it returns. In the case of ions, it would return the current state of the ion.

```ts
get count = ion(0)

function logCurrentCount() {
   console.log('current count', count)
}

// compiles to:
const $count = ion(0)

function logCurrentCount() {
   console.log('current count', $count())
}
```

### Setter
If the getter assigned to a `get` variable has a `value` property setter, that setter will be used as the setter for the `get` variable. It is otherwise read-only.

```ts
get count = ion(0)
get doubleCount = ion(() => count * 2) // read-only

function increment() {
   count++  // calls setter
}

// compiles to:

const $count = ion(0)
const $doubleCount = ion(() => $count() * 2) // read-only

function increment() {
   $count.value++  // calls setter
}
```

### Getter access
We also need syntax to access the getter function itself in order to pass the reference into other function scopes, including in the template, or to call any ion methods

```tsx
function Counter() {

   get count = ion(0, {
      increment() {
         count++
      },
      decrement() {
         count--
      }
   })

   console.log('current state', count) // 0
   console.log('getter', @count) // () => { track(); return currentState; }

   return template(
      <>
         <p>{@count}</p>
         <button on:click={e => @count.increment()}>+</button>
         <button on:click={e => @count.decrement()}>-</button>
      </>
   )
}

// compiles to:
function Counter() {

   const $count = ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   console.log('current state', $count()) // 0
   console.log('getter', $count) // () => { track(); return currentState; }

   return template(
      <>
         <p>{$count}</p>
         <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>
      </>
   )
}
```

This syntax can likewise be used to access getters on object properties. Static properties are distinguished from reactive properties by passing in the state (e.g. player.name) vs the getter (e.g. player.@points)

```tsx
function PlayerScoreBoard({ name }) {

   const player = ionic({
      name: a,
      points: 0,
      addPoint () {
         this.points++
      },
      minusPoint() {
         this.points--
      }
   })

   
   return template(
      <p>{player.name}: <input mu:value={player.@points}/></p>
      <button on:click={e => player.addPoint()}>+</button>
      <button on:click={e => player.minusPoint()}>-</button>
   )
}
```

### Derivation Shorthand

### Getter parameters

A reactive syntax consistent with existing JavaScript syntax and getter setter behavior mimicking.


