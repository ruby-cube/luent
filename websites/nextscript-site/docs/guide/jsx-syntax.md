::: tip This project is in early development.
Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable. 

We'd love help getting this project off the ground. Learn how to contribute [here](https://github.com/ruby-cube/luent/blob/main/CONTRIBUTING.md).
:::

# JSX Syntax

## JSX flow expressions
<!-- `{FlowFn(...arguments, jsx)}` -->
<code>{<i>FlowFn</i>(<i>jsx</i>)}</code>
| <code>{<i>FlowFn</i>(<i>...arguments</i>, <i>jsx</i>)}</code>

A JSX flow expression is a [JSX call expression](/guide/terminology#jsx-call-expression) where the callee is a JSXFlow-branded, Pascal-cased function and the final argument is one of the following JSX-like entities:
- JSX fragment
- JSX element
- JSX element block
- [JSX gateway function](#jsx-gateway-function)
- [JSX factory](/guide/terminology#jsx-factory)

The final argument forms an [implicit JSX fragment factory](#implicit-jsx-fragment-factory) if it is a JSX element block—a sequence of one or more root JSX elements.

```nsx
<section>
  {If(inStock,
    <span class='status'>In stock</span>
    <button on:click={addToCart}>Buy</button>
  )}
  {Else(
    <span class='status'>Sold out</span>
  )}
</section>
```
::: info transpiled
```tsx
<section>
  {If(inStock, () =>
    <>
      <span class='status'>In stock</span>
      <button on:click={addToCart}>Buy</button>
    </>
  )}
  {Else(() =>
    <>
      <span class='status'>Sold out</span>
    </>
  )}
</section>
```
:::



<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

### Implicit JSX fragment factories
A JSX block forms an implicit JSX fragment factory if it satisfies the following conditions:
- it consists of one or more root JSX elements
- it does not have JSX expression containers or JSX text at the root level
- it is the last argument of a [JSX flow expression](#jsx-flow-expressions)

```nsx
<section>
  {If(inStock,
    <span class='status'>In stock</span>
    <button on:click={addToCart}>Buy</button>
  )}
  {Else(
    <span class='status'>Sold out</span>
  )}
</section>
```
::: info transpiled
```tsx
<section>
  {If(inStock, () =>
    <>
      <span class='status'>In stock</span>
      <button on:click={addToCart}>Buy</button>
    </>
  )}
  {Else(() =>
    <>
      <span class='status'>Sold out</span>
    </>
  )}
</section>
```
:::

If the JSX block contains a JSX expression container or JSX text, the compiler will throw an error. You must instead explicitly wrap the JSX block in a JSX fragment factory or use the [JSX gateway function shorthand](#jsx-gateway-function).
```nsx
<div>
  {If(folder,
    {If(open, // ❌
      <ul>
        {For(folder.items, item =>
          <li>{item}</li>
        )}
      </ul>
      <button on:click={addItem}>+</button>
    )}
  )}
</div>
```

::: info transpiled
```tsx
<div>
  {If(folder,
    {If(open, () =>
      <>
        <ul>
          {For(folder.items, item =>
            <li>{item}</li>
          )}
        </ul>
        <button on:click={addItem}>+</button>
      </>
    )}
  )}
</div>
```
:::

## JSX gateway
<!-- `JavaScript <:> JSX` -->
<code>{ <i>JavaScript</i> <:> <i>JSX</i> }</code>

The JSX gateway syntax marks the transition from JavaScript into JSX. It wraps the JSX block that follows it in a fragment and returns that fragment. It is only valid when used in a [JSX gateway return](#jsx-gateway-return) or a [JSX gateway function](#jsx-gateway-function).

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

### JSX gateway return
<!-- `{ statements; <:> jsx }` -->
<code>{ <i>statements;</i> <:> <i>jsx</i> }</code>

A JSX gateway return is shorthand for a return statement that returns a JSX fragment.

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
::: info transpiled
```tsx
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
:::
<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

### JSX gateway function
<!-- `(parameters) <:> jsx` | `<:> jsx` -->
<code>(<i>parameters</i>) <:> <i>jsx</i></code> | 
<code><:> <i>jsx</i></code>

A JSX gateway function is shorthand for an arrow function expression that returns a JSX fragment. It may only appear as the final argument of a [JSX flow expression](#jsx-flow-expressions). Parameter parentheses may be omitted if there are one or no parameters.

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
            <li>{index + 1}: {item.title}</li>
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
<!-- `<:component>jsx</:component>` | `<:component as={component}>jsx</:component>` -->
<code><:component><i>jsx</i></:component></code> |
<code><:component as={<i>component</i>}><i>jsx</i></:component></code>

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