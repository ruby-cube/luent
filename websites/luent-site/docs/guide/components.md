# Components

Components are [render functions](/guide/rendering-views#view-templates) that may be instantiated through JSX tag syntax. A render function is a valid component only if it is:
- defined with a single [setup parameter](#the-setup-parameter) or no parameters
- Pascal-cased


<!-- 

that create a view. They are essentially view templates and serve as the building blocks of an island.

To define a component, declare a function that returns a view written in [JSX](#jsx) or [NSX]()*. -->
**Defining a component:**
```nsx
// HelloWorld.nsx
function HelloWorld() {
  <:>
    <p>Hello World.</p>
  </:>
}
```

```tsx
// HelloWorld.tsx
function HelloWorld() {
  return <>
    <p>Hello World.</p>
  </>
}
```
<!-- 
### Tag Syntax

Components are instantiated through JSX tag syntax: -->
**Instantiating a component:**
```nsx
<HelloWorld />
```
```tsx
<HelloWorld />
```
<!-- While technically, components with no parameters or slots may simply be invoked, e.g. `HelloWorld()`, the JSX syntax offers a consistent, readable way to instantiate components. -->


## Nesting Components
Similar to function calls, component tags may be nested within components.

```nsx
// Layout.nsx
function Layout() {
  <:>
    <NavBar />
    <Main />
    <Footer/>
  </:>
}
```
```tsx
// Layout.tsx
function Layout() {
  return <>
    <NavBar />
    <Main />
    <Footer/>
  </>
}
```

:::info Note
Components must not be `async` functions or return promises. 

To learn about async rendering and scheduling async tasks, see [Async Rendering](), [The Render Cycle](), [Lifecycle Hooks](), and [Awaiting Promises]().
:::


## The setup parameter

Components may be configured through a setup parameter, whose type is annotated using the `FromTag` utility type. The setup parameter is an object containing all the bindings declared on the JSX tag.

**Component with setup parameter**

```nsx
import type { FromTag } from 'luent';

function MessageDisplay(setup: FromTag<{
  message: Ion<string>
}>) {
  const { message@ } = setup
  <:>
    <p>{message@}</p>
  </:>
}
```
```tsx
import type { FromTag } from 'luent';

function MessageDisplay(setup: FromTag<{
  message: Ion<string>
}>) {
  const { $message } = setup
  return <>
    <p>{$message}</p>
  </>
}
```

**Component tag with binding**

```nsx
<MessageDisplay message={msg@} />
```
```tsx
<MessageDisplay message={$msg} />
```

It is important to use the `FromTag` type helper to define the setup object as it serves as a translation layer between the component tag bindings and the component setup object.

:::danger Omitting `FromTag` ...
```nsx
// ❌ ... may cause type discrepancies
function MessageDisplay(setup: {
  message: Ion<string>
}) {
  const { message } = setup
  <:>
    <p>{message}</p>
  </:>
}
```
```tsx
// ❌ ... may cause type discrepancies
function MessageDisplay(setup: {
  message: Ion<string>
}) {
  const { message } = setup
  return <>
    <p>{message}</p>
  </>
}
```
:::
To learn more about bindings see [Component Bindings]().


### Type Validation
The `FromTag` type utility provides type validation for the component tag based on the object type passed into `FromTag`.

```tsx
// ❌ Type 'number' is not assignable to type 'string | Ion<string>'
<MessageDisplay message={9} />
```


### Ion Normalization
A binding typed with `Ion<T>` may receive an input that is either `T` or `Ion<T>`. This allows the component consumer to decide whether a binding should be reactive or not. The component itself normalizes the binding to an accessor by accessing it with a `$` prefix (or with the `@` postfix in NextScript) and treats it as potentially reactive.

```tsx
function MessageDisplay(setup: FromTag<{
  message: Ion<string>
}>) {
  const { $message } = setup;

  track($message, () => {
    console.log('The message changed!')
  })

  return <>
    <p>{$message}</p>
  </>
}
```

### Optional setup bindings
Components can make a setup binding optional by typing it as optional in the `FromTag` object.

```tsx
function Counter(setup: FromTag<{
   limit?: number
}>) {
   const { limit } = setup;

   const $count = ion(0)

   return <>
      <button 
        on:click={() => $count.value++ }
        disabled={limit ? () => $count() === limit : undefined}
      >
        {$count}
      </button>
   </>
}
```
```tsx
<Counter />
```


### Setup defaults

Components may provide a default value for a setup binding by typing it as optional and providing a default value during destructuring.

```tsx
function Counter(setup: FromTag<{
   limit?: number
}>) {
   const { limit = 100 } = setup;

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
```tsx
<Counter />
```


### Dynamic tags

Similar to components, HTML elements may be rendered dynamically by binding the tag name to a Pascal-cased variable.

```tsx
function Article(setup: FromTag<{
  Heading?: 'h1' | 'h2' | 'h3' | ComponentTag,
  heading: string,
  text: string
}>) {
  const { Heading = 'h1', heading, text } = setup; 

  return <>
    <article>
      <Heading>{heading}</Heading>
      <p>{text}</p>
    </article>
  </>
}
```

Note that dynamic tags are not reactive. To render dynamic tags reactively, use in conjunction with [`As()`](/guide/view-control-flow.html#as-case).



<!-- Instantiating views as components through JSX tag syntax enables features such as:
- input normalization
- style composition
- binding forwarding and auto-binding
- component ref access
- mutation safety checking and mutable binding -->




<!-- 
#### Parameters

Render functions may define parameters.

```nsx
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
function Counter(start: number) {
  const $count = ion(start)
  return <>
    <button on:click={()=> $count.value++}>
      {$count}
    </button>
  </>
}
```

```nsx
mountIsland(() => {
  <:>
    <h1>The Counter App</h1>
    <div>{Counter(0)}</div>
  </:>
}, "#counter-app");
```
```tsx
mountIsland(() => (
  <>
    <h1>The Counter App</h1>
    <div>{Counter(0)}</div>
  </>
), "#counter-app");
```

...or a parameter object for better clarity at call sites:

```nsx
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
function Counter({ start, increment }: {
  start: number,
  increment: number
}) {
  const $count = ion(start)
  return <>
    <button on:click={()=> $count.value += increment}>
      {$count}
    </button>
  </>
}
```

```nsx
mountIsland(() => {
  <:>
    <h1>The Counter App</h1>
    <div>{Counter({ start: 0, increment: 5 })}</div>
  </:>
}, "counter-app");
```
```tsx
mountIsland(() => (
  <>
    <h1>The Counter App</h1>
    <div>{Counter({ start: 0, increment: 5 })}</div>
  </>
), "counter-app");
``` -->
<!-- 
## Components

Component setup functions are render functions with additional ergonomic features provided through JSX tag syntax and the `FromTag` setup object.

**Component setup function**

```nsx
function MessageDisplay(setup: FromTag<{
  message: Ion<string>
}>) {
  const { message@ } = setup
  <:>
    <p>{message@}</p>
  </:>
}
```
```tsx
function MessageDisplay(setup: FromTag<{
  message: Ion<string>
}>) {
  const { $message } = setup
  return <>
    <p>{$message}</p>
  </>
}
```

**JSX tag syntax**

```nsx
<MessageDisplay message={msg@} />
```
```tsx
<MessageDisplay message={$msg} />
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
 -->

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
mountIsland(() => {
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
function Dialog(setup: { Slot: RenderTag }) {
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

