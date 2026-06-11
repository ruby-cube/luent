# Component Bindings

## Style Composition
## Data
## Scoped Styles

## From Tag

#### Input Validation
Defaults

### Data and Method Binding
```tsx
function App() {
   get count = ion(0)
   
   <::>
      <Counter {count} increment={() => count++} />
   </::>
}


function Counter(setup: {
   count: Ion<number>
   increment: () => void
}) {
   const { count@, increment } = fromTag(setup)

   <::>
      <button on:click={increment}>+</button>
   </::>
}
```




### Event Binding
Note: Component events are auto-typed as optional.
```tsx
function App() {
   
   <Counter 
      limit={Math.floor(Math.random() * 50)} 
      onLimitReached={e => console.log('limit reached:', e.limit)}
   />
}


function Counter(setup: {
   start?: number
   limit: number
   onLimitReached: HandleEvent<{ limit: number }>
}) {
   const { start = 0, limit, onLimitReached } = setup

   get count = ion(0, {
      increment() { count++ }
   })

   function increment() {
      if (count > limit) return;
      count@.increment();
      if (count === limit) {
         onLimitReached?.({ limit })
      }
   }
   
   <button on:click={increment}>+</button>
}
```
## Event Bubbling


### Slots
```tsx
```

### Slot Parameters
```tsx
```

### Named Slots
```tsx
```


## Forwarded Bindings
### Auto-binding
To offer some flexibility in bindings, a component may designate a single node—usually the root node, though not necessarily—for a parent to bind additional data, methods, attributes or events to. The designated node can be a DOM element or a component.

Auto-bind handles collisions according to binding type. Event handlers and lifecycle hooks are composed such that handlers registered in child components will run before handlers of parent components, similar to event bubbling. The class attribute is aggregated. Microclasses are composed using the configured merge strategy (defaults to tailwind-merge). For colliding data, methods, attributes and style properties, the parent overrides the child.

```tsx
function App() {
  get count = ion(0)
  
  <Counter 
   count={count} 
   increment={() => count++} 
   style='color: red'
   on:click={() => console.log('counter clicked')}
  />
}


function Counter(setup: WithRef<'button'> & {
  count: Ion<number>
  increment: () => void
}) {
  const { count@, increment, ...rest } = setup

  <div class='counter'>
   <button on:click={increment} auto-bind={rest}>+</button>
  </div>
}
```

> **Code-switch**
> - **React:** (approx.) ref forwarding, rest props and spread attributes
> - **Vue:** (approx.) inherited attributes, fallthrough attributes

### X-ray binding
To offer even more flexibility in bindings, a component may specify multiple nodes for a parent to bind additional data, methods, attributes or events to.
```tsx
function App() {

  <Counter 
   xray:plus={x => <x.button on:click={logIncrement} />
	  xray:minus={x => <x.button on:click={logDecrement} />
  />
}


function Counter(setup: WithRef<'div'> & {
  'xray:plus': Xray<'button'>;
  'xray:minus': Xray<'button'>;
}) {
  const { xray, ...rest } = setup

  const count = ion(0, {
   increment() { count++ },
   decrement() { count-- }
  })

  <div class='counter' auto-bind={rest}>
   <button on:click={count.increment} auto-bind={xray.plus}>+</button>
   <button on:click={count.decrement} auto-bind={xray.minus}>-</button>
  </div>
}
```

