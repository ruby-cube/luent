::: tip This project is in early development.
Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable. 

We'd love help getting this project off the ground. Learn how to contribute [here](https://github.com/ruby-cube/luent/blob/main/CONTRIBUTING.md).
:::

# JSX Syntax

## JSX gateway return
`{ statements; <:> JSX }` | `{Fn(...args, <:> JSX)}`

The JSX gateway return syntax, `<:>`, signifies a switch from JavaScript to JSX, which extends to the end of the containing JavaScript block or expression position. It returns the JSX as a fragment. A JSX gateway is only valid in a statement position or as the arrow of a JSX gateway function expression.

```nsx
function Foo() {
   const foo = getFoo();
   <:>
   <p>{foo}</p>
   <p>{foo}</p>
}
```
::: info transpiled
```tsx
function Foo() {
   const foo = getFoo();
   return <>
      <p>{foo}</p>
      <p>{foo}</p>
   </>;
}
```
:::

```nsx
function Foo() {
   const foo = getFoo();
   if (foo) {
      <:>
      <p>{foo}</p>
   }
   <:>
   <p>Nothing</p>
}
```
::: info transpiled
```tsx
function Foo() {
   const foo = getFoo();
   if (foo) {
      return <><p>{foo}</p></>
   }
   return <><p>Nothing</p></>
}
```
:::



## JSX gateway returns
`() => { statements; <:> <tag/> }` • JSX fragment return statements

```nsx
<article>
  {For(sections, section => {
    const highlight = HighlighterKit(section)
    <:>
    <section>
      <h2 class={highlight}>{section.title}</h2>
      <p>{section.body}</p>
    </section>
    <hr/>
  })}
</article>
```
```tsx
// native equivalent
<article>
  {For(sections, section => {
    const highlight = HighlighterKit(section)
    return (
      <>
        <section>
          <h2 class={highlight}>{section.title}</h2>
          <p>{section.body}</p>
        </section>
        <hr/>
      </>
    )
  })}
</article>
```
<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX flow expressions
`{Fn(...args, <tag>)}`

A JSX flow expression is a JSX call expression where the callee is a pascale-cased function and the final argument is a JSX entity or factory:
- JSX fragment
- JSX element
- JSX children
- JSX gateway function expression
- JSX factory

The final argument is normalized to a JSX fragment factory at compile time.

**with a single root:**
```nsx
<div>
   {If(active, 
      <p>{foo}</p>
   )}
</div>
```
::: info transpiled
```tsx
<div>
   {If(active, () =>
      <><p>{foo}</p></>
   )}
</div>
```
:::

**with multiple roots:**
```nsx
<div>
   {If(active, 
      <p>{foo}</p>
      <p>{foo}</p>
   )}
</div>
```
::: info transpiled
```tsx
<div>
   {If(active, () =>
      <>
         <p>{foo}</p>
         <p>{foo}</p>
      </>
   )}
</div>
```
:::



<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX gateway function expressions
`(parameters) <:> JSX` | `<:> JSX` 

A JSX gateway function expression is shorthand for an arrow function that returns a JSX fragment. It may only appear as the final argument of a JSX flow expression. Parameter parentheses may only be omitted if there are no parameters. 

```nsx
<div>
   {If(active, <:>
      Hello world
   )}
</div>
```
::: info transpiled
```tsx
<div>
   {If(active, () =>
      <>Hello world</>
   )}
</div>
```
:::

```nsx
<div>
   {If(active, <:>
      {If(open,
         <p>Hello world</p>
      )}
   )}
</div>
```
::: info transpiled
```tsx
<div>
   {If(active, () => 
      <>
      {If(open,
         <p>Hello world</p>
      )}
      </>
   )}
</div>
```
:::
```nsx
<div>
   {If(active, (o) <:>
      Hello world
   )}
</div>
```
::: info transpiled
```tsx
<div>
   {If(active, (o) =>
      <>
         Hello world
      </>
   )}
</div>
```
:::
```nsx
<div>
   {If(active, (o) <:>
      {If(open,
         <p>Hello world</p>
      )}
   )}
</div>
```
::: info transpiled
```tsx
<div>
   {If(active, (o) =>
      <>
         {If(open,
            <p>Hello world</p>
         )}
      </>
   )}
</div>
```
:::

```nsx
<div>
   {If(active, (o, p) <:>
      Hello world
   )}
</div>
```
::: info transpiled
```tsx
<div>
   {If(active, (o, p) =>
      <>
         Hello world
      </>
   )}
</div>
```
:::

```nsx
// X invalid: not the final argument of a JSX flow expression
const renderFoo = (x) <:>
   {If(open,
      <p>Hello world</p>
   )}
   <div>other</div>;
```

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX keyword element
`<*keyword><*keyword>`

A JSX keyword element is a reserved symbol-prefixed language element registered by the transpiler. Components and native elements may not serve as keyword elements. Any unknown, unregistered keyword elements result in compile-time errors. Currently, there is only one keyword element (the component element).

```nsx
function Foo({ bar }) {
  get count = ion(0)

  <:component>
    <p>{bar}</p>
    <button on:click={() => count++ }>{count@}</button>
  </:component>
}
```

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX return element
`<:keyword></:keyword>`

A JSX return element is a colon-prefixed [keyword element](#jsx-keyword-element) that returns its keyword element. All following sibling statements are unreachable. Currently, there is only one return element: the [component element](#jsx-component-element)

```nsx
function Foo({ bar }) {
  get count = ion(0)

  <:component>
    <p>{bar}</p>
    <button on:click={() => count++ }>{count@}</button>
  </:component>
}
```


<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX component element
`<:component as={component}></:component>`

The JSX component element is an [auto-returned](#jsx-return-element) [JSX keyword element](#jsx-keyword-element) that enables refs of component instances to be typed. The default implementation of JSXComponent simply returns a ComponentKit, a plain object containing the component instance and nodes.

```ts
type JSXComponent = <T>(setup: { as?: T, Slot: NSXNode | NSXNode[] }) => ComponentKit<T>

interface ComponentKit<T> {
   component: T
   nodes: NSXNode[];
}
```
```nsx
get dialog = NodeRef(Dialog)

<button on:click={() => dialog?.open()}>submit</button>
<Dialog ref={dialog}>
   <DialogContent close={() => dialog?.close()}/>
</Dialog>
```
```nsx
function Dialog({ Slot }) {
   get opened = ion(false)
   const open = () => { opened = true }
   const close = () => { opened = false }

   <:component as={{ open, close }}>  
      {If(opened, 
         <o--body>
            <div>{Slot()}</div>
         </o--body>
      )}
   </:component>
}
```
::: info transpiled
```tsx
function Dialog({ Slot }) {
   get opened = ion(false)
   const open = () => { opened = true }
   const close = () => { opened = false }

   return JSXComponent({
      Slot: <>
         {If(opened, 
            <o--body>
               <div>{Slot()}</div>
            </o--body>
         )}
      </>,
      as: { open, close }
   }) 
}
```
:::