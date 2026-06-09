# Anatomy of an App

## Mounting an App
There are three main steps to mounting an app with Luent.
- defining the app with one or more [components](#component-anatomy)
- mounting the root component to an HTML element
- loading the entry script in the HTML document

**Define the app**
```tsx
function HelloWorld() {
  <:component>
    <p>Hello World.</p>
  </:component>
}
```
**Designate an app container in HTML**
```html
<div id="app"></div>
```

**Instantiate and mount the app**

via selector
```tsx
// main.tsx
createRoot(() => 
  <HelloWorld/>
).mount('#app')
```
or by passing a DOM node
```tsx
const div = document.querySelector('#app')

createRoot(() => 
  <HelloWorld/>
).mount(div)
```

**Load the entry script**
```html
<script type="module" src="/main.tsx"></script>
```


## Component Anatomy

Components are the building blocks of an app. They are defined through component factories. 

A function is considered a component factory when it:
- declares zero or one parameter
- expects a `FromTag` object when a parameter is declared
- returns a `ComponentKit`
Component kits are created by passing a [JSX template](#jsx-templates) to `component()`

Functions that satisfy these requirements may be instantiated through their JSX tag form.

:::info Type definitions
```ts
type RawJSXNode = any | any[]

type ComponentKit = { 
  nodes: RawJSXNode, 
  component?: object
}

type FromTag<T extends object> = ToSetup<T> & ToAttributes<T>
```
:::
**Define a component**
```tsx
function MessageApp(setup: FromTag<{
  message?: string
}>) {
  const { message = 'Hello World' } = setup

  <:component>
    <p>{message}</p>
  </:component>
}
```
**Instantiate component through its tag form**
```tsx
// main.tsx
createRoot(() => 
  <MessageApp message="I'm learning Luent!"/>
).mount('#app')
```

## JSX Templates

JSX templates describe a component's user interface through HTML-like tags, which are transpiled to JavaScript. 

Luent transpiles JSX into basic `jsx()` calls for straightforward mental mapping between JSX syntax and compiled output. It additionally extends the base JSX transform with three minimal transforms:
- JSX slots (known as `children` in classic JSX) are normalized to JSX array factories so that parent nodes may be created before their descendants, e.g. `<Parent><Child/></Parent>` → `jsx(Parent, { Slot: () => [jsx(Child)] })`
- [JSX flow expressions](/guide/template-control-flow) (designated JSX call expressions that form a control flow series) are compiled into a single series node. This could be done at runtime, but Luent takes care of this at compile time to reduce runtime overhead.
- JSX flow expression slots (the final argument of a JSX flow expression) are also normalized to JSX array factories.

```tsx
<Parent foo={foo} bar={bar()} on:click={logClick}>
  <Child />
  {If(active, 
    <div>Hello world! - {name}</div>
  )}
  {Else(
    <div>😴zzzzzz</div>
  )}
</Parent>
```

:::info Transpiled
```jsx
jsx(Parent, { foo: foo, bar: bar(), 'on:click': logClick,
  Slot: () => [
    jsx(Child),
    IfSeries(
      If(active, () => [
        jsx('div', { Slot: () => ['Hello world! - ', name]})
      ]),
      Else(() => [
        jsx('div', { Slot: () => ['😴zzzzzz']})
      ])
    )
  ]
})
```
:::
