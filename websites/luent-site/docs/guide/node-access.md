# Node Access

## Node Refs

TODO:

DOM elements may be accessed from the template by passing in a node ref to  JSX element tag. Node refs may be in the form of a getter function or an array.


To access a DOM element, we create a node getter function, by calling `NodeRef()` and pass it to the JSX tag whose element you want to access. The value of the ref will initially be undefined. Once the template has been rendered to the screen, we have access to the element.

```tsx
function DrawingApp() {
  const $canvas = NodeRef<'canvas'>() // create ref

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
        ref={$canvas} /* pass ref to template */
        width="900"
        height="500"
			  {...DrawingKit($canvas())}
      ></canvas>
    </div>
  )
}
```

#### Node Refs in Iterated Templates
#### Component Refs
- Absorbed ions?
- Ref forwarding
