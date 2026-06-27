# Node Access



## Node Refs

DOM elements and component instances may be accessed from the view by passing a node ref to a JSX tag. Node refs may be in the form of a getter function or a node ref tuple for iterative nodes.

### Single node refs
Node refs are created by passing the tag name or component factory to `NodeRef()`. This will return a getter function. The value of the ref will be undefined until the node is created.

```tsx
function DrawingApp() {
  const $canvas = NodeRef('canvas') // create ref

  function clearCanvas() {
    const canvas = $canvas() // access the element
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  return component(
    <div class="canvas-app">
      <button type="button" on:click={clearCanvas}>Clear</button>
      <canvas
        ref={$canvas} /* pass ref to node */
        width="900"
        height="500"
			  {...DrawingKit($canvas())}
      ></canvas>
    </div>
  )
}
```

### Iterative node refs
```tsx
const tds = NodeRef('td', [])
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


<!-- #### Component Node Refss -->
<!-- - Absorbed ions?
- Ref forwarding -->
:::info Type definitions

```ts
type RawJSXNode = any | any[];

type ComponentKit = {
  nodes: RawJSXNode;
  component: object;
};
```

:::


### Inline hooks
Nodes may also be accessed through [inline hooks](/guide/lifecycle-hooks#inline-hooks)