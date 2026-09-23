# Context Bindings

When a binding originates from an ancestor scope rather than a parent scope and/or is accessed by multiple components, 

Avoid drilling through multiple components in order to pass a value down to where it's needed.

<!-- Components may also be configured by adding bindings to an ancestor context node. -->

There are three parts to context binding.
- creating a context key
- declaring and accessing the binding
- providing the binding

## Creating a context key
Create a context key by calling `ContextKey()` and passing in a type argument. The type is used to validate the provided value.

<!-- Context keys should be created in the module 

or a module that  -->

**Required context entry**
```nsx
const USER = ContextKey<User>()
```
```tsx
const USER = ContextKey<User>()
```

**Optional context entry**
```nsx
const USER = ContextKey<User>('?')
```
```tsx
const USER = ContextKey<User>('?')
```

**Optional with default value**
```nsx
const USER = ContextKey<User>(() => { 
  name: 'John Doe', 
  description: 'Nothing special'
})
```
```tsx
const USER = ContextKey<User>(() => { 
  name: 'John Doe', 
  description: 'Nothing special'
})
```

We recommend exporting context keys in a default export so that modules that import the keys can namespace them as needed.
```nsx
export default {
  USER
}
```
```tsx
export default {
  USER
}
```
:::details CODE SWITCH
**React:** `createContext()`

**Vue:** `InjectionKey<T>`

**Svelte:** `createContext()`

**Solid:** `createContext()`

**Angular:** `InjectionToken<T>`
:::

<p align="right"><a href="#context-bindings" style="text-decoration: none">[top]</a></p>

## Accessing the binding
**Simple access**
```nsx
function UserProfile() {
  const user = fromContext(USER);
  <:>
    <h1>{user.name}</h1>
    <p>{user.description}</p>
  </:>
}
```
```tsx
function UserProfile() {
  const user = fromContext(USER);
  return <>
    <h1>{user.name}</h1>
    <p>{user.description}</p>
  </>
}
```

**Providing default value**
```nsx
function UserProfile() {
  const user = fromContext(USER) ?? new User();
  <:>
    <h1>{user.name}</h1>
    <p>{user.description}</p>
  </:>
}
```
```tsx
function UserProfile() {
  const user = fromContext(USER) ?? new User();
  return <>
    <h1>{user.name}</h1>
    <p>{user.description}</p>
  </>
}
```

**With optional tag binding**

Tag bindings typed using `FromContext` are automatically optional. If a tag binding is not provided, the nearest context binding will be accessed.

```nsx
function UserProfile(setup: FromTag<{
  user: FromContext<typeof USER>
}>) {
  const { user = fromContext(USER) } = setup;

  <:>
    <h1>{user.name}</h1>
    <p>{user.description}</p>
  </:>
}
```
```tsx
function UserProfile(setup: FromTag<{
  user: FromContext<typeof USER>
}>) {
  const { user = fromContext(USER) } = setup;

  return <>
    <h1>{user.name}</h1>
    <p>{user.description}</p>
  </>
}
```

<p align="right"><a href="#context-bindings" style="text-decoration: none">[top]</a></p>

## Providing the binding
```nsx
<o:context map={USER(user)}>
  <Workspace />
</o:context>
```
```tsx
<o:context map={USER(user)}>
  <Workspace />
</o:context>
```
:::details CODE SWITCH
**React:** `<Context.Provider value={...}>`, `useContext()`

**Vue:** `provide()`, `inject()`

**Svelte:** `setContext()`, `getContext()`

**Solid:** `<Context.Provider value={...}>`, `useContext()`

**Angular:** provider tree + `inject()`
:::

#### Providing multiple bindings

Multiple context bindings may be provided from a single <code>{'<o:context>'}</code> node.
```nsx
<o:context map={[USER(user), THEME(theme)]}>
  <Workspace />
</o:context>
```
```tsx
<o:context map={[USER(user), THEME(theme)]}>
  <Workspace />
</o:context>
```

#### Merging keys

Merge context keys to provide the same binding across multiple decoupled components.
```nsx
import UserProfile from './UserProfile'
import Settings from './Settings'

const USER = mergeKeys(UserProfile.USER, Settings.USER);

function App() {
  const user = getUser();
  <:>
    <o:context map={USER(user)}>
      <Workspace />
    </o:context>
  </:>
}
```
```tsx
import UserProfile from './UserProfile'
import Settings from './Settings'

const USER = mergeKeys(UserProfile.USER, Settings.USER);

function App() {
  const user = getUser();
  return <>
    <o:context map={USER(user)}>
      <Workspace />
    </o:context>
  </>
}
```

## Types of bindings
There are four main types of component bindings:

- data
- actions
- views
- events 

<p align="right"><a href="#context-bindings" style="text-decoration: none">[top]</a></p>

<!-- ## Data
### Static bindings
### Reactive bindings -->
## Ion normalization
**Creating a context key**
```nsx
const USER = ContextKey<Ion<User>>()
```
```tsx
const USER = ContextKey<Ion<User>>()
```
**Declaring & accessing the binding**
```nsx
function UserProfile() {
  get user = fromContext(USER)@
  <:>
    <h1>{(user.name)@}</h1>
    <p>{(user.description)@}</p>
  </:>
}
```
```tsx
function UserProfile() {
  const $user = fromContext$(USER)
  return <>
    <h1>{() => $user().name}</h1>
    <p>{() => $user().description}</p>
  </>
}
```
<p align="right"><a href="#context-bindings" style="text-decoration: none">[top]</a></p>


## Mutable bindings
**Declaring & accessing a mutable binding**
```nsx
function UserProfile() {
  const user = fromContext(MU(USER));
  <:>
    <h1>{(user.name)@}</h1>
    <p>{(user.description)@}</p>
    <ProfileEditor mu:user={user} />
  </:>
}
```
```tsx
function UserProfile() {
  const user = fromContext(MU(USER));
  return <>
    <h1>{() => user.name}</h1>
    <p>{() => user.description}</p>
    <ProfileEditor mu:user={user} />
  </>
}
```
**Providing a mutable binding**
```nsx
<o:context map={MU(USER)(user)}>
  <Workspace />
</o:context>
```
```tsx
<o:context map={MU(USER)(user)}>
  <Workspace />
</o:context>
```
<p align="right"><a href="#context-bindings" style="text-decoration: none">[top]</a></p>

## Events
<span class='doc-tag'>WIP</span><span class='doc-tag'>Experimental</span>

:::warning UNDER CONSTRUCTION
This feature is not yet available.
:::
Contextual events bubble up the tree.

**Creating an event key**
```nsx
const FIELD_CHANGE = EventKey<{ text: string }>()
```
```tsx
const FIELD_CHANGE = EventKey<{ text: string }>()
```

**Accessing a contextual event emitter**
```nsx
function Form() {
  const emitFieldChange = fromContext(FIELD_CHANGE);

  <:>
    <input type='text' 
      on:change={e => emitFieldChange({ text: e.target.value })}
    />
  </:>
}
```
```tsx
function Form() {
  const emitFieldChange = fromContext(FIELD_CHANGE);

  return <>
    <input type='text' 
      on:change={e => emitFieldChange({ text: e.target.value })}
    />
  </>
}
```

**Registering a contextual event handler**
```nsx
<o:context map={[
  ON(FIELD_CHANGE)(e => console.log(e.text))
]}>
  <App />
</o:context>
```
```tsx
<o:context map={[
  ON(FIELD_CHANGE)(e => console.log(e.text))
]}>
  <App />
</o:context>
```

<p align="right"><a href="#context-bindings" style="text-decoration: none">[top]</a></p>

