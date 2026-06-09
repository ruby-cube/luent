


### Mutable Data Binding
```tsx
function App() {
  get count = ion(0, {
    increment() { count++ },
    decrement() { count-- },
    isNegative(ƒ: pure) { return count < 0 },
  })
  
  <Component>
    <Counter mu:count={count@} />
  </Component>
}

function Counter(setup: FromTag<{
  'mu:count': Ion<number> & { 
    increment: () => void; 
    isNegative: (ƒ: pure) => boolean
  };
}>) {
  const { mu } = setup;
  get { count@ } = mu;

  <Component>
    {count@}
    <button on:click={e=> mu.count++}>+</button>
    <button on:click={e=> count@.isNegative()}>negative?</button>
  </Component>
}

foo(muo({ count: mu.count@ }))

function foo(mu: Mu<{ count: number }>) {
  
}

function App() {
  get count = ion(0, {
    increment() { count++ }
  })
  
  <Component>
    <Counter mu:count={count@} />
  </Component>
}

function Counter(setup: FromTag<{
  'mu?:count': Ion<number> & { increment: void }
}>) {
  const { mu, count@ } = setup

  <Component>
    {count}
    <button on:click={() => mu.count && count@.increment()}>+</button>
  </Component>
}

```