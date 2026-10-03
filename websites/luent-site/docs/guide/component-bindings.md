# Component Bindings

Components may be configured by adding bindings to the component tag.

## Accessing bindings
Component bindings are declared and accessed through the setup parameter.

```nsx
function Counter(setup: FromTag<{
  limit: number
  onClick: HandleClick<{ count: number }>
}>) {
  const { limit, emitClick } = setup

  get count = ion(0)

  <:>
    <button 
      on:click={() => { 
        count++; 
        emitClick({ count }) 
      }} 
      disabled={(count === limit)@}
    >
      {count@}
    </button>
  </:>
}
```

```tsx
function Counter(setup: FromTag<{
  limit: number
  onClick: HandleClick<{ count: number }>
}>) {
  const { limit, emitClick } = setup

  const $count = ion(0)

  return <>
    <button 
      on:click={() => { 
        $count.value++; 
        emitClick({ count: $count() }) 
      }} 
      disabled={() => $count() === limit}
    >
      {$count}
    </button>
  </>
}
```

For information on type validation of bindings, optional bindings, and default values, see [The Setup Parameter](/guide/components#the-setup-parameter)


## Providing bindings
Bindings are provided at component instantiation through JSX tag and attribute syntax.

```nsx
<Counter limit={100} onClick={e => console.log('count:', e.count)} />
```
```tsx
<Counter limit={100} onClick={e => console.log('count:', e.count)} />
```

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>

## Types of bindings

There are five main types of component bindings:
- data
- actions
- events
- views
- forwarded



<!-- 
### Data and Method Binding
```tsx
function App() {
   get count = ion(0)
   
   <:>
      <Counter {count} increment={() => count++} />
   </:>
}


function Counter(setup: FromTag<{
   count: Ion<number>
   increment: () => void
   getEmoji: () => string
}>) {
   const { count@, increment, getEmoji } = setup

   <:>
      <button on:click={increment}>+</button>
   </:>
}
``` -->


## Data
Data bindings provide a component with data. The bindings may be static or reactive.

### Static bindings
Static bindings provide a component with constant values.

```nsx
function Counter(setup: FromTag<{
   limit: number
}>) {
   const { limit } = setup

   get count = ion(0)

   <:>
      <button 
        on:click={() => count++ } 
        disabled={(count === limit)@}
      >
        {count@}
      </button>
   </:>
}
```
```tsx
function Counter(setup: FromTag<{
   limit: number
}>) {
   const { limit } = setup

   const $count = ion(0)

   return <>
      <button 
        on:click={() => $count.value++ } 
        disabled={() => $count() === limit}
      >
        {$count}
      </button>
   </>
}
```

```nsx
<Counter limit={100} />
```
```tsx
<Counter limit={100} />
```

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>


### Reactive bindings

To specify a reactive binding, type it with the `Ion` type helper.

Reactive bindings are merely *potentially* reactive because reactivity is ultimately determined by what the consumer of the component passes in. The component itself normalizes the binding to an accessor through the `$` prefix (or `@` postfix in NoriScript) and treats it as reactive. 

[Ion normalization](/guide/components#ion-normalization) allows flexibility for the consumer while preserving simplicity in the component.

```nsx
function Counter(setup: FromTag<{
  limit: Ion<number>
}>) {
  const { limit@ } = setup

  get count = ion(0)

  <:>
    <button 
      on:click={() => count++ }
      disabled={(count >= limit)@}
    >
      {count@}
    </button>
  </:>
}
```

```tsx
function Counter(setup: FromTag<{
  limit: Ion<number>
}>) {
  const { $limit } = setup

  const $count = ion(0)

  return <>
    <button 
      on:click={() => $count.value++ }
      disabled={() => $count() >= $limit()}
    >
      {$count}
    </button>
  </>
}
```

**Providing a reactive ion**
```nsx
<Counter limit={limit@} />
```
```tsx
<Counter limit={$limit} />
```

**Providing a static value to a reactive binding**
```nsx
<Counter limit={100} />
```
```tsx
<Counter limit={100} />
```

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>


### Nested reactivity
Static and reactive bindings may contain nested reactivity through ionic structures.

```nsx
function List(setup: FromTag<{
  items: Ionic<string[]>
}>) {
  const { items } = setup
  <:>
    <ul>
      {For(items, item@ => 
        <li>{item@}</li>
      )}
    </ul>
  </:>
}
```
```tsx
function List(setup: FromTag<{
  items: Ionic<string[]>
}>) {
  const { items } = setup
  return <>
    <ul>
      {For(items, $item => 
        <li>{$item}</li>
      )}
    </ul>
  </>
}
```

**Providing an ionic structure**
```nsx
function App() {
  const list = ionic(['apple', 'peach', 'pear'])
  <:>
    <List items={list} />
    <button on:click={() => list.push(randomFruit())}>
      add
    </button>
  </:>
}
```
```tsx
function App() {
  const list = ionic(['apple', 'peach', 'pear'])
  return <>
    <List items={list} />
    <button on:click={() => list.push(randomFruit())}>
      add
    </button>
  </>
}
```

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>

### Mutable bindings
By default, component bindings are deeply read-only, enforced at compile time*. However, mutable bindings may be marked as mutable through mutability annotations. To learn more see [Mutation Safety](/guide/mutation-safety).

:::warning * NOT YET AVAILABLE
Mutation-safety checking is currently under development and not yet ready to use. However, mutability annotations may be beneficial regardless of mutation safety enforcement.
:::

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>


## Actions
Action bindings provide components with a callback that implements an action.

```nsx
function Counter(setup: FromTag<{
  count: Ion<number>
  increment: () => void // action binding
}>) {
  const { count@, increment } = setup;
  <:>
    <button on:click={increment}>{count@}</button>
  </:>
}
```
```tsx
function Counter(setup: FromTag<{
  count: Ion<number>
  increment: () => void // action binding
}>) {
  const { $count, increment } = setup;
  return <>
    <button on:click={increment}>{$count}</button>
  </>
}
```

```tsx
<Counter 
  count={count@} 
  increment={() => count++}
/>

```

```tsx
<Counter 
  count={$count} 
  increment={() => $count.value++}
/>

```

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>

## Events
Components may emit events and consumers may register event handlers on the component through event bindings. The binding name must be camel-cased according to the pattern <code>on<i>[Event]</i></code>.

Component event bindings are essentially action bindings that are auto-typed as optional, renamed from <code>on<i>[Event]</i></code> to <code>emit<i>[Event]</i></code>, and auto-default to a no-op function.

```nsx
function App() {
  <:>
    <Counter 
      limit={Math.floor(Math.random() * 50)} 
      onLimitReached={e => console.log('limit reached:', e.limit)}
    />
  </:>
}

function Counter(setup: FromTag<{
  start?: number
  limit: number
  onLimitReached: HandleEvent<{ limit: number }>
}>) {
  const { start = 0, limit, emitLimitReached } = setup

  get count = ion(0, {
    increment() { count++ }
  })

  function increment() {
    if (count > limit) return;
    count@.increment();
    if (count === limit) {
      emitLimitReached({ limit })
    }
  }
   
  <:>
    <button on:click={increment} disabled={(count === limit)@}>+</button>
  </:>
}
```

```tsx
function App() {
  return <>
    <Counter 
      limit={Math.floor(Math.random() * 50)} 
      onLimitReached={e => console.log('limit reached:', e.limit)}
    />
  </>
}

function Counter(setup: FromTag<{
  start?: number
  limit: number
  onLimitReached: HandleEvent<{ limit: number }>
}>) {
  const { start = 0, limit, emitLimitReached } = setup

  const $count = ion(0, {
    increment() { $count.value++ }
  })

  function increment() {
    if ($count() > limit) 
      return;
    $count.increment();
    if ($count() === limit) {
      emitLimitReached({ limit })
    }
  }
   
  return <>
    <button on:click={increment} disabled={() => $count() === limit}>+</button>
  </>
}
```

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>


## Views

View bindings are essentially components passed into a component.

### The `Slot` component
A component must explicitly declare a `Slot` component in order to allow slot contents.

```nsx
function Card(setup: FromTag<{
  Slot: RenderTag
}>) {
  const { Slot } = setup;
  <:>
    <div class='card'>
      <Slot/>
    </div>
  </:>
}
```

```tsx
function Card(setup: FromTag<{
  Slot: RenderTag
}>) {
  const { Slot } = setup;
  return <>
    <div class='card'>
      <Slot/>
    </div>
  </>
}
```

The JSX compiler transforms slot contents into the `Slot` component.
```nsx
<Card>
  <h2>{heading}</h2>
  <p>{description}</p>
</Card>
```
```tsx
<Card>
  <h2>{heading}</h2>
  <p>{description}</p>
</Card>
```
:::info transpiled
```js
jsx(Card, {
  Slot: () => [
    jsx('h2', { Slot: () => [heading] }),
    jsx('p', { Slot: () => [description] })
  ]
})
```
:::

:::details CODE SWITCH
**React:** the `children` prop

**Vue:** slots
:::

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>


### Named views
Slot components do not receive any parameters. To render a component that receives setup bindings or to render multiple components, declare named view bindings. 

Named view bindings must be Pascale-cased in order to be instantiated through JSX syntax.

```nsx
function ClubsCard(setup: FromTag<{
  Heading: RenderTag<{ symbol: string }>
  Description: RenderTag
}>) {
  const { Heading, Description } = setup;
  <:>
    <div class='card'>
      <Heading symbol='♣' />
      <hr/>
      <Description />
    </div>
  </:>
}
```

```tsx
function ClubsCard(setup: FromTag<{
  Heading: RenderTag<{ symbol: string }>
  Description: RenderTag
}>) {
  const { Heading, Description } = setup;
  return <>
    <div class='card'>
      <Heading symbol='♣' />
      <hr/>
      <Description />
    </div>
  </>
}
```

```nsx
<ClubsCard
  Heading={({ symbol }) =>
    <h2>{symbol} {heading}</h2>}
  Description={
    <p>{description}</p>}
></Card>
```

```tsx
<ClubsCard
  Heading={({ symbol }) =>
    <h2>{symbol} {heading}</h2>}
  Description={
    <p>{description}</p>}
></Card>
```

The JSX compiler normalizes the value of view bindings to render functions.

:::info transpiled
```js
jsx(ClubsCard, {
  Heading: ({ symbol }) => 
    jsx('h2', { Slot: () => [symbol, heading] }),
  Description: () => [
    jsx('p', { Slot: () => [description] })
  ]
})
```
:::

:::details CODE SWITCH
**React**: JSX props

**Vue:** Named slots
:::













<!-- These bindings include:

- ions
- events
- styles
- attributes
- slots
- lifecycle hooks
- namespaced bindings
- callbacks -->

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>


## Forwarded Bindings
### Auto-binding
To offer some flexibility in bindings, a component may designate a single node—usually the root node, though not necessarily—for a parent to bind additional data, methods, attributes or events to. The designated node can be a DOM element or a component.

Auto-bind handles collisions according to binding type. Event handlers and lifecycle hooks are composed such that handlers registered in child components will run before handlers of parent components, similar to event bubbling. The class attribute is aggregated. Microclasses are composed using the configured merge strategy (defaults to tailwind-merge). For colliding data, methods, attributes and style properties, the parent overrides the child.

```nsx
function App() {
  get count = ion(0)
  <:>
    <Counter 
      count={count@} 
      increment={() => count++} 
      style='color: red'
      on:click={() => console.log('counter clicked')}
    />
  </:>
}


function Counter(setup: FromTag<'button', {
  count: Ion<number>
  increment: () => void
}>) {
  const { count@, increment, ...rest } = setup
  <:>
    <div class='counter'>
      <button on:click={increment} auto-bind={rest}>
        {count@}
      </button>
    </div>
  </:>
}
```

```tsx
function App() {
  const $count = ion(0)
  return <>
    <Counter 
      count={$count} 
      increment={() => $count.value++} 
      style='color: red'
      on:click={() => console.log('counter clicked')}
    />
  </>
}


function Counter(setup: FromTag<'button', {
  count: Ion<number>
  increment: () => void
}>) {
  const { $count, increment, ...rest } = setup
  return <>
    <div class='counter'>
      <button on:click={increment} auto-bind={rest}>
        {$count}
      </button>
    </div>
  </>
}
```

:::details CODE SWITCH
**React:** (approx.) ref forwarding, rest props and spread attributes

**Vue:** (approx.) inherited attributes, fallthrough attributes
:::

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>

### X-ray binding
To offer even more flexibility in bindings, a component may specify multiple nodes for a parent to bind additional data, methods, attributes or events to through x-ray binding.
```nsx
function App() {
  return <>
    <Counter 
      xray:plus={x => <x.button on:click={logIncrement} />
      xray:minus={x => <x.button on:click={logDecrement} />
    />
  </>
}


function Counter(setup: FromTag<'div', {
  'xray:plus': Xray<'button'>;
  'xray:minus': Xray<'button'>;
}>) {
  const { xray, ...rest } = setup

  get count = ion(0, {
    increment() { count++ },
    decrement() { count-- }
  })

  return <>
    <div class='counter' auto-bind={rest}>
      <button on:click={count@.increment} auto-bind={xray.plus}>+</button>
      <button on:click={count@.decrement} auto-bind={xray.minus}>-</button>
    </div>
  </>
}
```
```tsx
function App() {
  return <>
    <Counter 
      xray:plus={x => <x.button on:click={logIncrement} />
      xray:minus={x => <x.button on:click={logDecrement} />
    />
  </>
}


function Counter(setup: FromTag<'div', {
  'xray:plus': Xray<'button'>;
  'xray:minus': Xray<'button'>;
}>) {
  const { xray, ...rest } = setup

  const $count = ion(0, {
    increment() { $count.value++ },
    decrement() { $count.value-- }
  })

  return <>
    <div class='counter' auto-bind={rest}>
      <button on:click={$count.increment} auto-bind={xray.plus}>+</button>
      <button on:click={$count.decrement} auto-bind={xray.minus}>-</button>
    </div>
  </>
}
```

<p align="right"><a href="#component-bindings" style="text-decoration: none">[top]</a></p>

