# Anatomy of an App

## Mounting an app

There are three main steps to mounting an app to the DOM:

- defining the app with one or more [render functions](#render-functions)
- mounting the root view to an HTML element
- loading the entry script in the HTML document

**Define the app**

```nsx
// HelloWorld.nsx
function HelloWorld() {
  <:>
    <p>Hello World.</p>
  </:>
}
```

**Designate an app container in the HTML**

```html
<!-- index.html -->
<luent-island id="app"></luent-island>
```

**Instantiate and mount the app**

```tsx
// main.tsx
mount(HelloWorld, "#app");
```

**Load the entry script**

```html
<!-- index.html -->
<script type="module" src="/main.tsx"></script>
```

## Render functions

Render functions are functions that create a view. They are essentially view templates and serve as the building blocks of an app.

To define a render function, declare a function that returns a view composed using [JSX](#jsx) or [NSX]().

```tsx
function HelloWorld() {
  <:>
    <p>Hello World.</p>
  </:>
}
```

#### Setting up stateful views

In Luent, render functions, much like class constructors and factory functions, run once per view creation rather than per view update. Render functions may set up reactive state to pass to its view. The reactive portions of the view are then granularly updated through fine-grained reactivity.

```tsx
function Counter() {
  get count = ion(0)
  <:>
    <button on:click={()=> count++}>
      {count@}
    </button>
  </:>
}
```

#### Parameters

Render functions may define parameters.

```tsx
function Counter(start: number) {
  get count = ion(start)
  <:>
    <button on:click={()=> count++}>
      {count@}
    </button>
  </:>
}
```

```tsx
mount(() => (
  <:>
    <h1>The Counter App</h1>
    <div>{Counter(0)}</div>
  </:>
), "#counter-app");
```

...or a parameter object for better clarity at call sites:

```tsx
function Counter({ start, increment }: {
  start: number,
  increment: number
}) {
  get count = ion(start)
  <:>
    <button on:click={()=> count += increment}>
      {count@}
    </button>
  </:>
}
```

```tsx
mount(() => {
  <:>
    <h1>The Counter App</h1>
    <div>{Counter({ start: 0, increment: 5 })}</div>
  </:>
}, "#counter-app");
```

## Components

Component setup functions are render functions with additional ergonomic features provided through JSX tag syntax, the setup object, and `fromTag()` setup interpreter.

**Component setup function**
<!-- ```tsx
function MessageDisplay(setup: {
  message: Ion<string>
}) {
  const { message@ } = fromTag(setup)
  <:>
    <p>{message@}</p>
  </:>
}
``` -->

<!-- :::nsx
```nsx
get count = ion(0)
```
```tsx
const $count = ion(0)
```
::: -->

:::nsx
```nsx
function MessageDisplay(setup: {
  message: Ion<string>
}) {
  const { message@ } = fromTag(setup)
  <:>
    <p>{message@}</p>
  </:>
}
```
```tsx
function MessageDisplay(setup: {
  message: Ion<string>
}) {
  const { $message } = fromTag(setup)
  <:>
    <p>{$message}</p>
  </:>
}
```
:::

**JSX tag syntax**
```tsx
<MessageDisplay message={msg@} />
```

Instantiating views as components through JSX tag syntax enables features such as:
- input normalization
- style composition
- binding forwarding and auto-binding
- component ref access
- mutation safety checking and mutable binding

To learn more about these features see [Component Bindings](), [Node Access](), and [Mutable Bindings]()


## Tag vs function call
Any render function with zero parameters may be called through JSX syntax. If a render function declares a setup object parameter, it must inter

Simple render functions bypass the overhead of setting up components. Component setup functions improve [TODO:]


<!-- 
 For example, the above `Counter` render function can be called like so:

```tsx
<Counter start={0} increment={5} />
```



:::info Transpiled
```js
jsx(Counter, { start: 0, increment: 5 })
```
:::
To provide a render function with these ergonomic features, instantiate the view through [JSX tag syntax](#jsx).

Any render function may be called through a JSX tag. However, component setup functions **MUST** be called through a JSX tag. A render function is considered a component setup function if:


As a convention, a setup object parameter named `setup` indicates that the render function must be called through JSX tag syntax.

**(A)** it takes in a setup object with properties for bindings other than static data bindings

-and/or-

**(B)** it returns a `ComponentKit` that exposes a component instance along with the view

### Component setup

The component setup object is a special object containing bindings received through the component tag. Bindings other than static data bindings, for example ion bindings, must be interpreted through the `fromTag()` helper function. This allows Luent to normalize bindings for ergonomic handling and mutation safety checks.

**Define a component**

```tsx
function MessageDisplay(setup: {
  message: Ion<string>
}) {
  const { message@ } = fromTag(setup)
  <:>
    <p>{message@}</p>
  </:>
}
```

**Instantiate through its tag form**

```tsx
// main.tsx
mount(() => {
  get msg = ion("Hello world!")
  <:>
    <MessageDisplay message={msg@} />
    <input type='text' mu:value={msg@} />
  </:>
}, "#app");
```
:::warning
Destructuring non-static data bindings from the setup object without `fromTag()` may cause type inconsistency and type errors.

```tsx
function MessageDisplay({ message }: { // ❌ destructuring without `fromTag()`
  message: Ion<string>
}) {
  console.log(message()) // ❌ potential TypeError: `message` is not a function
  <:>
    <p>{message}</p>
  </:>
}
```
Although static data bindings may be destructured without issue, it is recommended to always interpret the setup object with `fromTag()` as a consistent rule of thumb.
:::

For a list of non-static data bindings and to learn more about component bindings, see [Component Bindings]()

### Component kits

A component kit may be written as a plain object, created using the `component()` helper function, or created through NSX's component syntax. To learn more about component kits and exposing/accessing component instances, see [Node Access](/guide/node-access#component-ref)

```tsx
function Dialog(setup: { Slot: RenderSlot }) {
  const { Slot } = fromTag(setup)

  get opened = ion(false)

  const dialog = { // component instance
    open() { opened = true },
    close() { opened = false }
  }

  <:: as={dialog}>
    {If(opened@,
      <o--body>
        <div>{Slot()}</div>
      </o--body>
    )}
  </::>
}
``` -->

## JSX

JSX describes a component's view through HTML-like tags, which are transpiled to JavaScript.

Luent transpiles JSX into basic `jsx()` calls for straightforward mental mapping between JSX syntax and compiled output. It additionally extends the base JSX transform with three minimal transforms:

- JSX slots (known as `children` in classic JSX) are normalized to JSX array factories so that parent nodes may be created before their descendants.
- [JSX flow expressions](/guide/view-control-flow) (JSX call expressions that form a control flow series) are compiled into a single series node. This could be done at runtime, but Luent takes care of this at compile time to reduce runtime overhead.
- JSX flow expression slots (the final argument of a JSX flow expression) are also normalized to JSX array factories.

```tsx
<Parent foo={foo} bar={bar()} on:click={logClick}>
  <Child />
  {If(active, <div>Hello world! - {name}</div>)}
  {Else(<div>😴zzzzzz</div>)}
</Parent>
```

:::info Transpiled

```jsx
jsx(Parent, {
  foo: foo,
  bar: bar(),
  "on:click": logClick,
  Slot: () => [
    jsx(Child),
    IfSeries(
      If(active, () => [jsx("div", { Slot: () => ["Hello world! - ", name] })]),
      Else(() => [jsx("div", { Slot: () => ["😴zzzzzz"] })]),
    ),
  ],
});
```

:::

#### Hyperscript

Those who prefer non-build workflows, render functions may technically be written using `jsx()` hyperscript, though a thin ergonomic wrapper around the function would probably make for better authoring experience and readability.

```ts
function HelloWorld() {
  return m("p", { Slot: "Hello world" });
}
```
