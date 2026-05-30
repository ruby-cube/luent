::: tip This project is in early development.
Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable. 

We'd love help getting this project off the ground. Learn how to contribute [here](https://github.com/ruby-cube/luent/blob/main/CONTRIBUTING.md).
:::

# JSX Syntax

## JSX flow expressions
`{Fn(...args, JSX)}`

A JSX flow expression is a [JSX call expression](/guide/terminology#jsx-call-expression) where the callee is a pascale-cased function and the final argument is a JSX entity or factory:
- JSX fragment
- JSX element
- JSX children
- [JSX gateway function](#jsx-gateway-function)
- [JSX factory](/guide/terminology#jsx-factory)

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


## JSX gateway return
`{ statements; <:> JSX }`

A JSX gateway return statement is shorthand for a return statement that returns a JSX fragment.

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

## JSX gateway function
`(...parameters) <:> JSX` 

A JSX gateway function expression is shorthand for an arrow function that returns a JSX fragment. It may only appear as the final argument of a [JSX flow expression](#jsx-flow-expressions). Parameter parentheses may only be omitted if there are no parameters. 

**with JSX text:**
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

**with JSX expression:**
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
**with parameters:**
```nsx
<ul>
   {For(list, (item, index) <:>
      {If(item.active,
         <li>{index + 1}: {item.title}</li>
      )}
   )}
</ul>
```
::: info transpiled
```tsx
<ul>
   {For(list, (item, index) =>
      <>
        {If(item.active, () => 
          <>
            <li>{index + 1}: {item}</li>
          </>
        )}
      </>
   )}
</ul>
```
:::
**invalid usage:**
```nsx
// X invalid: not the final argument of a JSX flow expression
const renderFoo = (x) <:>
   {If(open,
      <p>Hello world</p>
   )}
   <div>other</div>;
```

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX component element
`<:component as={component}></:component>`

The JSX component element is an auto-returned keyword element. It enables refs of component instances to be typed through its transpiled form: `JSXComponent()`. The default implementation of `JSXComponent` simply returns a `ComponentKit`, a plain object containing the component instance and nodes.

```nsx
function Parent() {
  // ref is typed based on `as` attribute of Dialog's `<:component>`
  get dialog = NodeRef(Dialog) 

  <:component>
    <button on:click={() => dialog?.open()}>submit</button>
    <Dialog ref={dialog}>
      <DialogContent close={() => dialog?.close()}/>
    </Dialog>
  </:component>
}
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

**interfaces:**
```ts
type JSXComponent = <T>(setup: { as?: T, Slot: NSXNode | NSXNode[] }) => ComponentKit<T>

interface ComponentKit<T> {
   component: T
   nodes: NSXNode[];
}
```