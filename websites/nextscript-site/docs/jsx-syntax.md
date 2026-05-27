::: tip This project is in early development.
Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable. 

We'd love help getting this project off the ground. Learn how to contribute [here]().
:::

# JSX Syntax

## JSX return statement
`{ statements; <//> JSX }` | `{Fn(...args, <//> JSX)}`

The JSX gateway return syntax, `<//>`, signifies a switch from JavaScript to JSX, which extends to the end of the containing JavaScript block or expression position. It returns the JSX as a fragment. A JSX gateway is only valid in a statement position or as the arrow of a JSX gateway function expression.

```tsx
function Something() {
   const foo = getSomething();
   <//>
   <p>{foo}</p>
   <p>{foo}</p>
}
```
::: info transpiled
```tsx
function Something() {
   const foo = getSomething();
   return <>
      <p>{foo}</p>
      <p>{foo}</p>
   </>;
}
```
:::

```tsx
function Something() {
   const foo = getSomething();
   if (foo) {
      <//>
      <p>{foo}</p>
   }
   <//>
   <p>Nothing :(</p>
}
```
::: info transpiled
```tsx
function Something() {
   const foo = getSomething();
   if (foo) {
      return <><p>{foo}</p></>
   }
   return <><p>Nothing :(</p></>
}
```
:::
<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX flow expression
`{Fn(...args, <tag>)}`

A JSX flow expression is a JSX call expression where the callee is a pascale-cased function and the final argument is a JSX entity or factory:
- JSX fragment
- JSX element
- JSX children
- JSX gateway function expression
- JSX factory

The final argument is normalized to a JSX fragment factory at compile time.

**with a single root:**
```tsx
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
```tsx
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

## JSX gateway function expression
`(parameters) <//> JSX` | `<//> JSX` 

A JSX gateway function expression is shorthand for an arrow function that returns a JSX fragment. It may only appear as the final argument of a JSX flow expression. Parameter parentheses may only be omitted if there are no parameters. 

```tsx
<div>
   {If(active, <//>
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

```tsx
<div>
   {If(active, <//>
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
```tsx
<div>
   {If(active, (o) <//>
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
```tsx
<div>
   {If(active, (o) <//>
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

```tsx
<div>
   {If(active, (o, p) <//>
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

```tsx
// X invalid: not the final argument of a JSX flow expression
const renderSomething = x <//>
   {If(open,
      <p>Hello world</p>
   )}
   <div>other</div>;
```

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX keyword element
`<*keyword><*keyword>`

A JSX keyword element is a reserved symbol-prefixed language element registered by the transpiler. Components and native elements may not serve as keyword elements. Any unknown, unregistered keyword elements result in compile-time errors. Currently, there is only one keyword element (the component element) and only one reserved symbol-prefix (the colon prefix for auto-returns).

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX return element
`<:keyword></:keyword>`

A JSX return element is a colon-prefixed keyword element that returns its keyword element. All following sibling statements are unreachable.


<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX component element
`<:component as={component}></:component>`

The JSX component element is an auto-returned JSX keyword element that allows refs of component instances to be typed. The default implementation of JSXComponent simply returns a ComponentKit, a plain object containing the component instance and nodes.

```ts
type JSXComponent = <T>(setup: { as?: T, Slot: NSXNode | NSXNode[] }) => ComponentKit<T>

interface ComponentKit<T> {
   component: T
   nodes: NSXNode[];
}
```
```ts
get dialog = NodeRef(Dialog)

<button on:click={() => dialog?.open()}>submit</button>
<Dialog ref={dialog}>
   <DialogContent close={() => dialog?.close()}/>
</Dialog>
```
```ts
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