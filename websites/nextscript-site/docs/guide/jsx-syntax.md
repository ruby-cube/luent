# JSX Syntax

::: tip This project is in early development.
Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable.
:::

## JSX fragment return
<code>() => { <i>statements;</i> <:> <i>JSX</i> </:>}</code>

A JSX fragment return is an auto-returning JSX fragment. It behaves like a return statement. Any code following its closing tag is unreachable.

```nsx
function Counter() {
  get count = ion(0);
  <:>
    <span>{count@}</span>
    <button on:click={() => count++}>+</button>
    <button on:click={() => count--}>-</button>
  </:>
}

```
::: info transpiled tsx
```tsx
function Counter() {
  const count = ion(0);

  return <>
    <span>{count}</span>
    <button on:click={() => count.value++}>+</button>
    <button on:click={() => count.value--}>-</button>
  </>
}
```
:::

#### Valid usage

Because it is shorthand for a return statement that returns a fragment, a fragment return is valid only in statement positions. For example, it may be used to express early returns within JavaScript blocks, but not within arrow functions with implicit returns.
```nsx
function Counter() {
  const authorized = getAuth();
  if (!authorized) {
    <:>
      <p>You are not authorized.</p>
    </:>
  }

  get count = ion(0);
  <:>
    <span>{count@}</span>
    <button on:click={() => count++}>+</button>
    <button on:click={() => count--}>-</button>
  </:>
}
```
::: danger Invalid usage: expression position
```nsx
// ❌
const Counter = ({ count@ }) => 
  <:>
    <span>{count@}</span>
    <button on:click={() => count++}>+</button>
    <button on:click={() => count--}>-</button>
  </:>
```
```nsx
// ✅ use a JSX fragment instead
const Counter = ({ count@ }) => 
  <>
    <span>{count@}</span>
    <button on:click={() => count++}>+</button>
    <button on:click={() => count--}>-</button>
  </>
```
```nsx
// ✅ or wrap in curly braces
const Counter = ({ count@ }) => {
  <:>
    <span>{count@}</span>
    <button on:click={() => count++}>+</button>
    <button on:click={() => count--}>-</button>
  </:>
}
```
:::

<!-- ## JSX gateway syntax -->
<!-- `JavaScript <:> JSX` -->
<!-- <code><i>JavaScript</i> <:> <i>JSX</i></code> -->

<!-- The JSX gateway syntax marks the transition from JavaScript in returned JSX. It wraps the JSX block that follows it in a fragment and returns that fragment. It is only valid when used in a [JSX gateway return](#jsx-gateway-return) or a [JSX gateway function](#jsx-gateway-function). -->

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>


## JSX flow expressions
<!-- `{FlowFn(...arguments, jsx)}` -->
<code>{<i>FlowFn</i>(<i>jsx</i>)}</code>
| <code>{<i>FlowFn</i>(<i>...arguments</i>, <i>jsx</i>)}</code>

A JSX flow expression is a [JSX call expression](/guide/terminology#jsx-call-expression) where the callee is a [JSX flow-branded](#jsx-flow-branded-functions) function and the final argument—the slot argument—is one of the following entities:
- an element-leading [JSX block](/guide/terminology#jsx-block)
- a fragment-leading [JSX block](/guide/terminology#jsx-block)
- [a JSX factory](/guide/terminology#jsx-factory)
- [a JSX gateway function](#jsx-gateway-function)

```nsx
<section>
  {If(inStock,  // with element-leading JSX block
    <span class='status'>In stock</span>
    <button on:click={addToCart}>Buy</button>
  )}
  {Else(  // with fragment-leading JSX block
    <>Folder items</>
    <span class='status'>Sold out</span>
  )}
</section>

<div>
  {If(folder, <//>  // with JSX gateway function
    {If(open,
      <ul>
        {For(folder.items, item =>  // with JSX factory
          <li>{item}</li>
        )}
      </ul>
      <button on:click={addItem}>+</button>
    )}
  )}
</div>
```

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

### JSX flow brand

A JSX flow-branded function is a function who satisfies the `JSXFlowBrand` and `JSXFlowFunction` interfaces.

::: info Type definitions
```tsx
declare const JSX_FLOW: unique symbol;

interface JSXFlowBrand<T extends string = string> { 
  [JSX_FLOW]: T 
}

interface JSXFlowFunction<A extends any[] = []> {
  (...args: [...A, JSXFlowSlot]): JSXElement
}

type JSXFlowSlot = () => JSXElement
```
:::

Frameworks and libraries can use `JSXFlowBrand` to define control-flow helpers such as `If()`.

```tsx
import type { JSXFlowBrand, JSXFlowSlot, JSXElement } from '@luent/nextscript';

declare const If: {
  (condition: unknown, slot: JSXFlowSlot): JSXElement
} & JSXFlowBrand<'if'>
```


The brand is a compile-time signal. It tells the NextScript preprocessor that the function participates in JSX flow transformations. Certain JSX flow types such as `'if'` and `'else'` also participate in [type-guarding](#type-guarding) transforms across a if-else flow series.


<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

### Slot transform
The slot argument of a JSX flow expression forms an implicit JSX fragment factory if it is an element- or fragment-leading [JSX block](/guide/terminology#jsx-block).

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
::: info transpiled tsx
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
<br></br>

If the JSX block leads with a JSX expression container, JSX text, or JSX statements fence, the compiler will throw an error.
```nsx
<div>
  {If(folder,
    {If(open, // ❌ SyntaxError
      <List items={folder.items} />
      <button on:click={addItem}>+</button>
    )}
  )}
</div>
```

::: info transpiled tsx
```tsx
<div>
  {If(folder,
    {If(open, () => // ❌ SyntaxError
      <>
        <List items={folder.items} /> 
        <button on:click={addItem}>+</button>
      </>
    )}
  )}
</div>
```
:::
<br></br>

... You must instead explicitly wrap the JSX block in a JSX fragment factory or use the [JSX gateway function shorthand](#jsx-gateway-function).

```nsx
<div>
  {If(folder, :>
    {If(open,
      <List items={folder.items} /> 
      <button on:click={addItem}>+</button>
    )}
  )}
</div>
```


<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

### Type guarding
`If`/`Else` flow expressions will perform type narrowing and widening similar to `if` statements in TypeScript.

```tsx
<div>
  {If(user, 
    <Avatar 
      username={user.name} 
    ></Avatar>
  )}
</div>
```
In the example above, no optional chaining is required when passing `user.name` due to type narrowing in scopes that are synchronous to the condition evaluation.<!--  However, optional chaining is still required in the `onClick` handler due to type widening in asynchronous scopes. -->

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX gateway function
<!-- `(parameters) <:> jsx` | `<:> jsx` -->
<code>(<i>parameters</i>) :> <i>jsx</i></code> | 
<code>:> <i>jsx</i></code>

A JSX gateway function is shorthand for an arrow function expression that returns a JSX fragment. It may only appear as the final argument of a [JSX flow expression](#jsx-flow-expressions). 

Parameter parentheses may be omitted if there are one or no parameters. The JSX gateway, `:>`, must be followed by a [JSX block](/guide/terminology#jsx-block)
<br></br>
<br></br>

**with JSX expression:**
```nsx
<div>
  {If(active, :>
    {If(open,
      <p>Hello world</p>
    )}
  )}
</div>
```
::: info transpiled tsx
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
<br></br>

**with parameters:**
```nsx
<div>
   {For(list, (item, index) :>
     <div>{index}</div>
     <div>{item}</div>
   )}
</div>
```
::: info transpiled tsx
```tsx
<div>
   {For(list, (item, index) =>
      <>
        <div>{index}</div>
        <div>{item}</div>
      </>
   )}
</div>
```
:::
<br></br>

**invalid usage:**
```nsx
// ❌ invalid: not the final argument of a JSX flow expression
const renderFoo = (x) :>
   {If(open,
      <p>Hello world</p>
   )}
   <div>other</div>;
```

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX statements fence
<!-- `(parameters) <:> jsx` | `<:> jsx` -->
<code><---> <i>statement(s)</i> <---></code>

JSX statements fences form a container for JavaScript statements that appear within a JSX block, marking the start and end of the statement(s).

```nsx
<article>
  {For(sections, section :>
    <--->
    const highlight = HighlighterKit(section)
    <--->
    <section>
      <h2 class={highlight}>{section.title}</h2>
      <p>{section.body}</p>
    </section>
    <hr/>
  )}
</article>
```
::: info transpiled tsx
```tsx
<article>
  {For(sections, section => {
    const highlight = HighlighterKit(section)
    return <>
      <section>
        <h2 class={highlight}>{section.title}</h2>
        <p>{section.body}</p>
      </section>
      <hr/>
    </>
  })}
</article>
```
:::

```nsx
<article>
  {For(sections, section :>
    <section>
      <--->
      const highlight = HighlighterKit(section)
      <--->
      <h2 class={highlight}>{section.title}</h2>
      <p>{section.body}</p>
    </section>
    <hr/>
  )}
</article>
```

::: info transpiled tsx
```tsx
<article>
  {For(sections, section => <>
    <section>
      {(() => {
        const highlight = HighlighterKit(section)
        return <>
          <h2 class={highlight}>{section.title}</h2>
          <p>{section.body}</p>
        </>
      })()}
    </section>
    <hr/>
    </>
  </>)}
</article>
```
:::

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>


## JSX style tags
<!-- <code><style><i>css rules</i></style></code> -->
<code>&lt;style&gt;<i>css</i>&lt;/style&gt;</code>

A JSX style tag is a special JSX tag whose slot is parsed as template literal text. Plain curly braces are treated as text while curly braces prefixed with a dollar sign, `${}`, serve as JavaScript expression containers. 

The slot is transformed into a tagged template literal call (`css` by default). The tag function must be provided by the JSX runtime.

```nsx
const FONT_SIZE = 16;

function Foo() {
  <:>
    <div class='message'>Hello world</div>
    <style>
      .message {
        color: blue;
        font-size: ${FONT_SIZE}
      }
    </style>
  </:>
}
```
:::info transpiled tsx
```tsx
import { css } from 'luent/jsx-runtime'
const FONT_SIZE = 16;

function Foo() {
  return <>
    <div class='message'>Hello world</div>
    <style>
      {css`
        .message {
          color: blue;
          font-size: ${FONT_SIZE}
        }
      `}
    </style>
  </>
}
```
:::


The `lang` attribute is used as the name of the tag function of the tagged template literal. If a `lang` is not specified, the tag function will default to `css`.
```nsx
<style lang='scss'>
  .message {
    color: blue;
    font-size: ${FONT_SIZE}
  }
</style>
```
:::info transpiled tsx
```tsx
<style lang='scss'>
  {scss`
    .message {
      color: blue;
      font-size: ${FONT_SIZE}
    }
  `}
</style>
```
:::


Frameworks and libraries may register custom style element names in the NextScript config. For example:
```tsx
// nextscript.config.ts

export default configureNextScript({
  jsx: {
    styleTags: ['o-style'],
  },
})
```
```nsx
<o-style>
  .message {
    color: blue;
    font-size: ${FONT_SIZE}
  }
</o-style>
```
:::info transpiled tsx
```tsx
<o-style>
  {css`
    .message {
      color: blue;
      font-size: ${FONT_SIZE}
    }
  `}
</o-style>
```
:::


<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>

## JSX style bindings
<code><<i>node</i> style=\`css rules\`></<i>node</i>></code>


JSX style binding values that are wrapped in backticks will be transformed into tagged template literals, using the `css` tag function provided by the JSX runtime.

```nsx
<div
  on:pointerdown={e => maybeDrag(e, item, index)}
  on:transitionend={() => taggingAlong = false}
  class={{
    'tag-along': tagalong@,
    'dragged': dragged@,
  }}
  style=`
    z-index: ${(dragged ? order(index) : 0)@};
    transform: ${(dragged ? transform : undefined)@};
  `
></div>
```

:::info transpiled tsx
```tsx
<div
  on:pointerdown={e => maybeDrag(e, item, $index())}
  on:transitionend={() => $taggingAlong.value = false}
  class={{
    'tag-along': $tagalong,
    'dragged': $dragged,
  }}
  style={css`
    z-index: ${() => $dragged() ? order(index) : 0};
    transform: ${() => $dragged() ? $transform() : undefined)@};
  `}
></div>
```
:::

<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>


## JSX component return
<!-- `<::>jsx</::>` | `<:: as={component}>jsx</::>` -->
<!-- <code><::><i>jsx</i></::></code> | -->
<code><:: as={<i>component</i>}><i>jsx</i></::></code>

The JSX component tag represents an auto-returned `jsxComponent()` call. It enables refs of component instances to be typed through its `as` attribute. 

The `jsxComponent` function must be provided by the JSX runtime and must implement the JSXComponent interface.

```nsx
function Parent() {
  // ref is typed based on `as` attribute of Dialog's `<::>`
  get dialog = NodeRef(Dialog) 

  <:>
    <button on:click={() => dialog?.open()}>submit</button>
    <Dialog ref={dialog}>
      <DialogContent close={() => dialog?.close()}/>
    </Dialog>
  </:>
}
```
```nsx
function Dialog({ Slot }) {
  get opened = ion(false);
  const dialog = {
    open() { opened = true }
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
```
::: info transpiled tsx
```tsx
import { jsxComponent } from 'jsx-runtime'

function Dialog({ Slot }) {
  const opened = ion(false)
  const dialog = {
    open() { opened.value = true }
    close() { opened.value = false }
  }

  return jsxComponent({
    Slot: <>
      {If(opened, 
        <o--body>
          <div>{Slot()}</div>
        </o--body>
      )}
    </>,
    as: dialog
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
<p align="right"><a href="#jsx-syntax" style="text-decoration: none">[top]</a></p>