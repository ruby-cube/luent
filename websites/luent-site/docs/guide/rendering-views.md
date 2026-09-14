# Rendering views

Views are created through JSX syntax, HTML-like syntax that can interpolate JavaScript.

```nsx
<>
  <h1>Hello World</h1>  
  <p>It is {new Date().toLocaleString()}</p>
</>
```

```tsx
<>
  <h1>Hello World</h1>
  <p>It is {new Date().toLocaleString()}</p>
</>
```

## View templates

View templates are defined through render functions, functions that return a view. [Components](/guide/components) are view templates that may be instantiated through JSX tag syntax.

```nsx
function HelloWorld() {
  <:>
    <h1>Hello World</h1>  
    <p>It is {new Date().toLocaleString()}</p>
  </:>
}
```

```tsx
function HelloWorld() {
  return <>
    <h1>Hello World</h1>  
    <p>It is {new Date().toLocaleString()}</p>
  </>
}
```
**Component instantiation**
```nsx
<HelloWorld />
```

```tsx
<HelloWorld />
```

## Stateful views

In Luent, render functions, much like class constructors and factory functions, run once per view creation rather than per view update.

Render functions may set up reactive state to pass to its view. The reactive portions of the view are granularly updated through fine-grained reactivity. In the example below, only the text node rendering the count is re-rendered with each button click.

```nsx
function Counter() {
  get count = ion(0)
  <:>
    <button on:click={()=> count++}>
      {count@}
    </button>
  </:>
}
```

```tsx
function Counter() {
  const $count = ion(0)
  return <>
    <button on:click={()=> $count.value++}>
      {$count}
    </button>
  </>
}
```

## Mounting an island

<!-- In order for a view to be rendered to the screen, it must be mounted  -->

When a view is rendered and mounted onto static HTML at runtime, it is considered an island. Islands typically contain interactivity and shared context. 
<!-- Islands may also be pre-rendered as static html during builds to prevent layout shift. -->

There are three main steps to mounting an island:

- define the island with a render function
- mount it to a designated HTML element or custom tag
- load the entry script in the HTML document


**Designate an island container and load the entry script**
```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Counter</title>
</head>
<body>
  <counter-app></counter-app>
  <script type="module" src="/main.tsx"></script>
</body>
</html>
```

**Define and mount the island**

```nsx
// main.nsx
mountIsland(() => {
  const $count = ion(0)
  <:>
    <button on:click={()=> $count.value++}>
      {$count}
    </button>
  </:>
}, "counter-app");
```

```tsx
// main.tsx
mountIsland(() => {
  const $count = ion(0)
  return <>
    <button on:click={()=> $count.value++}>
      {$count}
    </button>
  </>
}, "counter-app");
```

Island containers may be any native element or a custom tag. Custom tag names must contain a dash. Mount to the island container by either passing in a css selector or the DOM node.


## JSX transpilation

Luent transpiles JSX tags into basic `jsx()` calls for straightforward mental mapping between JSX syntax and compiled output. It additionally extends the base JSX transform with three minimal transforms:

- JSX slots (known as `children` in classic JSX) are normalized to JSX array factories so that parent nodes may be created before their descendants.
- [JSX flow expressions](/guide/view-control-flow) (JSX call expressions that form a control flow series) are compiled into a single series node. This could be done at runtime, but Luent takes care of this at compile time to reduce runtime overhead.
- JSX flow expression slots (the final argument of a JSX flow expression) are also normalized to JSX array factories.

```nsx
<>
  <Parent 
    foo={foo} 
    bar={bar()} 
    on:click={logClick}
  >
    <Child />
    {If(active, 
      <div>Hello world! - {name}</div>
    )}
    {Else(
      <div>😴zzzzzz</div>
    )}
  </Parent>
</>
```

```tsx
<>
  <Parent 
    foo={foo} 
    bar={bar()} 
    on:click={logClick}
  >
    <Child />
    {If(active, 
      <div>Hello world! - {name}</div>
    )}
    {Else(
      <div>😴zzzzzz</div>
    )}
  </Parent>
</>
```

:::info Transpiled

```jsx
[
  jsx(Parent, {
    foo: foo,
    bar: bar(),
    "on:click": logClick,
    Slot: () => [
      jsx(Child),
      IfSeries(
        If(active, () => [
          jsx("div", { Slot: () => ["Hello world! - ", name] })
        ]),
        Else(() => [
          jsx("div", { Slot: () => ["😴zzzzzz"] })
        ]),
      ),
    ],
  })
]
```

:::


