# Centralized bindings


mergeKeys

## Root Context

### Reactive Context Entry

```ts
provideRoot(THEME);
```

```ts
const THEME = ContextKey<Ion<"dark" | "light">>();
```

```ts
const theme = $fromRoot(THEME);
```

### Static Context Entry

#### Provide context entry value

Provide root context via `<RootContext provide={}/>`

```tsx
// main.tsx
import { SCREEN_WIDTH } from '/components/Foo.tsx'

mountIsland(() => (
  <o--root provide={SCREEN_WIDTH(1020)}>
    <MyApp/>
  </o--root>
),'#app')
```

alternatively, call `provideRoot()` from any ancestor of the context accessor.

```ts
provideRoot(SCREEN_WIDTH, 1020);
```

#### Create typed context key

```ts
// Foo.tsx
export const SCREEN_WIDTH = ContextKey<number>();
```

#### Access context entry

```ts
// Foo.tsx
function Foo() {
  const screenWidth = fromRoot(SCREEN_WIDTH);
  /*...*/
}
```

### Dependency Injection

To decouple your app from implementation, inject class constructors or factories from the root.

```ts
const Foo = fromRoot(CLASS_FOO);
const foo = new Foo(bar);
```

or in one line:

```ts
const foo = new fromRoot(CLASS_FOO)(bar);
```
