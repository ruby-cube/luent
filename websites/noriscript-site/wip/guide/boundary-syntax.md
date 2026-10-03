# Boundary Syntax

::: tip This project is in early development.
Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable.
:::

## Boundary annotations


Namespace object(s) designated by the framework

### Parameter annotations
<code>+<i>annotation</i> <i>parameter</i>: Type</code>

destructured parameter with the annotation as the property and the parameter name as the alias.
```nsx
function foo(+mu bar: Bar) {
  // ...
}
```
:::info transpiled
```tsx
function foo({ mu: bar }: { mu: Bar }) {
  // ...
}
```
:::

### Argument annotations
<code>+<i>annotation</i> <i>argument</i></code>

an object literal with the annotation as the property key and the argument as the value

```nsx
foo(+mu bar);
```
:::info transpiled
```tsx
foo({ mu: bar });
```
:::

### Parameter object annotations
<code>{ +<i>annotation</i>:<i>key</i>: <i>Type/value</i> }</code>
```nsx
function Foo(setup: FromTag<{
  +mu:bar: MutableIon<string>
  +mu:count: MutableIon<number>
}>) {
  const { +mu:bar@, +mu:count@ } = setup
  
  // ...
}
```
:::info transpiled
```tsx
function Foo(setup: FromTag<{
  mu: { 
    bar: MutableIon<string> 
    count: MutableIon<number> 
  }
}>) {
  const { mu: { bar, count } } = setup
  
  // ...
}
```

```nsx
function FooKit(setup: {
  +mu:bar: MutableIon<string>
  +mu:count: MutableIon<number>
}) {
  const { +mu:bar@, +mu:count@ } = setup
  
  // ...
}

FooKit({ +mu:bar: bar@, +mu:count: count@ })
```
:::info transpiled
```tsx
function Foo(setup: FromTag<{
  mu: { 
    bar: MutableIon<string> 
    count: MutableIon<number> 
  }
}>) {
  const { mu: { bar, count } } = setup
  
  // ...
}
```
:::

### Destructuring annotations
destructuring a returned object or an object parameter
```nsx
const +mu bar = fromContext(MU(BAR))
```
:::info transpiled
```tsx
const { mu: bar } = fromContext(MU(BAR))
```
:::

```nsx
MU(BAR)(bar)
```


### Returned object annotations
```nsx
function getUser() {
  return +mu user
}

const +mu user = getUser()
```
```nsx
function getUser() {
  return { mu: user }
}

const { mu: user } = getUser()
```

### Returned optional mutability annotations
```nsx
function getUser() {
  return +mu? user
}

const +mu user = getUser()

const user = getUser()
```

:::info transpiled
```tsx
let user: User

type MuOr<T> = { mu: T, ['~phantom']: true } & T 

function getUser(): MuOr<User> {
  return muOr(user)
}

function muOr<T extends object>(object: T): MuOr<T> {
  return object
}

const { mu: user } = getUser()
```

```tsx
// transformed runtime (erase the { mu: ... } lie)
const user = getUser()
```
:::

### Returned object property annotations

```tsx
function useUserKit() {
  return { +mu:user: user }
}

const { +mu:user } = getUser()
```

#### Optional
```tsx
function useUserKit() {
  return {
    +mu?:user: user,
    other
  }
}

const { +mu:user } = useUserKit()

const { user } = useUserKit()
```

:::info transpiled
```tsx
function useUserKit() {
  return { mu: { user: user }, user }
}

const { mu: { user } } = useUserKit()

const { user } = useUserKit()
```
:::



### Parameter optional mutability annotations
<code>{ +<i>annotation</i>?:<i>key</i>: <i>Type?Type</i> }</code>
```nsx
function Foo(setup: FromTag<{
  +mu?:count: Mutable?Ion<number>
}>) {
  const { mu, count } = setup

  if (mu.count@) {
    mu.count++
  }

  // ...
}
```
:::info transpiled
```tsx
function Foo(setup: FromTag<{
  mu: { count?: MutableIon<number> }
  count?: Ion<number>
}>) {
  const { mu, count } = setup

  if (toAccessor(mu, 'count')) {
    mu.count++
  }

  // ...
}
```
:::


### Assertions
Assert returned object is mutable
```nsx
const +mu! counter = getCounter()
```
```tsx
const { mu: counter } = assertMu(getCounter())
```

Assert returned property is mutable
```nsx
const { +mu!: { counter } } = getCounterKit()
```
```tsx
const { mu: { counter } } = assertMuOb(getCounterKit())
```

Assert argument is mutable
```nsx
before:mount={node => {
  makeDraggable(+mu! node);
}}
```
```tsx
before:mount={node => {
  makeDraggable({ mu: node }!);
}}
```

Assert argument property is mutable
```nsx
before:mount={node => {
  makeDraggable({ +mu!:node: node });
}}
```
```tsx
before:mount={node => {
  makeDraggable({ 'mu:node': node }!);
}}
```

Assert parameter is mutable
```nsx
before:mount={(+mu! node) => {
  node.focus()
  makeDraggable(+mu node);
}}
```

```tsx
before:mount={(/*mu!*/node) => {
  node.focus()
  makeDraggable({ mu: node });
}}
```
