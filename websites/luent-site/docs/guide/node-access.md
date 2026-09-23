# Node Access



## Node Refs

DOM elements and component instances may be accessed from the view by passing a node ref to a JSX tag. Node refs may be in the form of a getter function or a node ref tuple for iterative nodes.

### Single node refs
Node refs are created by passing the tag name or component factory to `NodeRef()`. This will return a getter function. The value of the ref will be undefined until the node is created.

```nsx
function DrawingApp() {
  get canvas = NodeRef('canvas') // create ref

  function clearCanvas() {
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  return <>
    <div class="canvas-app">
      <button type="button" on:click={clearCanvas}>Clear</button>
      <canvas
        ref={canvas@} /* pass ref to node */
        width="900"
        height="500"
        {...DrawingKit(canvas)}
      ></canvas>
    </div>
  </>
}

```

```tsx
function DrawingApp() {
  const $canvas = NodeRef('canvas') // create ref

  function clearCanvas() {
    const canvas = $canvas() // access the element
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  return <>
    <div class="canvas-app">
      <button type="button" on:click={clearCanvas}>Clear</button>
      <canvas
        ref={$canvas} /* pass ref to node */
        width="900"
        height="500"
        {...DrawingKit($canvas())}
      ></canvas>
    </div>
  </>
}
```

### Iterative node refs
```nsx
const tds = NodeRef('td', [])
```
```tsx
const tds = NodeRef('td', [])
```
```nsx
<tr>
  <th>{row}</th>
  {Thru(cols.length, (_, col) =>
    <td ref={[tds, [row, col]]}>
      <Cell
        value={(cells[col][row])}
        setCellValue={value => { cells[col][row] = value }}
        calcCellValue={evalCell}
      ></Cell>
  </td>
  )}
</tr>
```
```tsx
<tr>
  <th>{row}</th>
  {Thru(cols.length, (_, col) =>
    <td ref={[tds, [row, col]]}>
      <Cell
        value={(cells[col][row])}
        setCellValue={value => { cells[col][row] = value }}
        calcCellValue={evalCell}
      ></Cell>
  </td>
  )}
</tr>
```

:::details CODE SWITCH
**React:** `useRef()` + ref={}

**Vue:** `useTemplateRef()` + ref={}

**Solid:** ref={}

**Svelte:** `$state()` + bind:this

**Angular:** `viewChild('element')` + #element
:::

<p align="right"><a href="#node-access" style="text-decoration: none">[top]</a></p>



## Component Nodes
A component may expose data and methods to its consumer through the `expose()` method. In NextScript, a component instance may be exposed through the component return syntax, <code><:: as={<i>component</i>}></code>.


```nsx
function Dialog(setup: FromTag<{ 
  Slot: RenderTag 
}>) {
  const { Slot } = setup;
  get opened = ion(false)

  <:: as={{
    open() { opened = true },
    close() { opened = false }
  }}>  
    {If(opened@, 
      <o--body>
        <div>
          <Slot/>
        </div>
      </o--body>
    )}
  </::>
}
```
```tsx
function Dialog(setup: FromTag<{ 
  Slot: RenderTag 
}>) {
  const { Slot } = setup;
  const opened = ion(false)

  return expose({
    open() { opened = true },
    close() { opened = false }
  }, <>
    {If(opened, 
      <o--body>
        <div>
          <Slot/>
        </div>
      </o--body>
    )}
  </>) 
}
```

The consumer can then accesses the component node using a node ref.

```nsx
function Parent() {
  // node is typed based on `as` attribute of Dialog's `<::>`
  get dialog = NodeRef(Dialog) 

  <:>
    <button on:click={() => dialog?.open()}>submit</button>
    <Dialog ref={dialog}>
      <DialogContent close={() => dialog?.close()}/>
    </Dialog>
  </:>
}
```
```tsx
function Parent() {
  // node is typed based on the exposed object
  const $dialog = NodeRef(Dialog) 

  return <>
    <button on:click={() => $dialog()?.open()}>submit</button>
    <Dialog ref={$dialog}>
      <DialogContent close={() => $dialog()?.close()}/>
    </Dialog>
  </>
}
```

:::details CODE SWITCH
**React:** `forwardRef()`, `useImperativeHandle()`

**Vue:** `defineExpose()`

**Svelte:** `export`

**Angular:** `@ViewChild(ChildComponent)`
:::

<p align="right"><a href="#node-access" style="text-decoration: none">[top]</a></p>


## Pre-created Elements
<span class='doc-tag'>Experimental</span>

Alternatively to node refs, pre-created elements may be rendered to the view using `asJSX()`. 

```nsx
function DrawingApp() {
  const canvas = DOMNode('canvas');
  const Canvas = asJSX(canvas)

  function clearCanvas() {
    const context = canvas.getContext("2d")
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div class="canvas-app">
      <button type="button" on:click={clearCanvas}>Clear</button>
      <Canvas
        width="900"
        height="500"
			  {...DrawingKit(canvas)}
      ></Canvas>
    </div>
  )
}
```
```tsx
function DrawingApp() {
  const canvas = DOMNode('canvas');
  const Canvas = asJSX(canvas)

  function clearCanvas() {
    const context = canvas.getContext("2d")
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div class="canvas-app">
      <button type="button" on:click={clearCanvas}>Clear</button>
      <Canvas
        width="900"
        height="500"
			  {...DrawingKit(canvas)}
      ></Canvas>
    </div>
  )
}
```

<p align="right"><a href="#node-access" style="text-decoration: none">[top]</a></p>



## Pre-existing Elements
<span class='doc-tag'>Experimental</span>

`asJSX()` nodes may also be used to create bindings on a pre-existing node

```tsx
function makeDraggable(node: HTMLElement, item: Item) {
  const $dragged = ion(() => isSelected(item) && $dragging());
  const $node = asJSX(node);

  const $transform = ion(() => (
    $dragged() 
      ? `translate(${$shiftY()}px, ${$shiftX())}px)` 
      : undefined
  ))

  <$node
    on:pointerdown={e => maybeDrag(e, item)}
    class={{ 'dragged': $dragged }}
    style={{ 'transform': $transform }}
  />
}
```



## Inline hooks
Nodes may also be accessed through [inline hooks](/guide/lifecycle-hooks#inline-hooks)


<p align="right"><a href="#node-access" style="text-decoration: none">[top]</a></p>
