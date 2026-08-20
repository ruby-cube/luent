import { component, css, NodeRef, Style } from "luent"

export function DoodleCanvas() {
  const { 
    $canvas, 
    startDrawing, 
    draw, 
    stopDrawing, 
    clearCanvas 
  } = DoodleCanvasKit();

  return (
    <>
      <div class="canvas-app">
        <div class="canvas">
          <canvas
            ref={$canvas}
            width="900"
            height="300"
            on:pointerdown={startDrawing}
            on:pointermove={draw}
            on:pointerup={stopDrawing}
            on:pointerleave={stopDrawing}
          ></canvas>
        </div>
        <button type="button" on:click={clearCanvas}>Clear</button>
      </div>

      {Style(css`
        .canvas-app {
          display: grid;
          gap: 10px;
        }

        .canvas {
          width: 100%;
          overflow: hidden;
          border-radius: .75rem;
        }

        .canvas-app button {
          margin: 28px;
        }

        html:not(.dark) .canvas {
          border: 1px solid #ccc;
        }

        .canvas-app button {
          border: 1px solid var(--vp-c-divider);
          border-radius: .75rem;
          width: 90px;
          padding: 6px 10px;
          cursor: pointer;
          justify-self: end;
        }

        .canvas-app canvas {
          display: block;
          border: none;
          background: #fff;
          cursor: crosshair;
          touch-action: none;
        }
      `)}
    </>
  )
}

function DoodleCanvasKit() {
  const $canvas = NodeRef("canvas")

  let isDrawing = false
  let lastX = 0
  let lastY = 0

  function getContext() {
    const canvas = $canvas()
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    context.lineJoin = "round"
    context.lineCap = "round"
    context.lineWidth = 4
    context.strokeStyle = "#111"

    return context
  }

  type DrawEvent = { clientX: number, clientY: number }

  function getMousePosition(e: DrawEvent) {
    const canvas = $canvas()
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect()

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  return {
    $canvas,

    startDrawing(e: DrawEvent) {
      const point = getMousePosition(e)
      if (!point) return

      isDrawing = true
      lastX = point.x
      lastY = point.y
    },

    draw(e: DrawEvent) {
      if (!isDrawing) return

      const context = getContext()
      const point = getMousePosition(e)
      if (!context || !point) return

      context.beginPath()
      context.moveTo(lastX, lastY)
      context.lineTo(point.x, point.y)
      context.stroke()

      lastX = point.x
      lastY = point.y
    },

    stopDrawing() {
      isDrawing = false
    },

    clearCanvas() {
      const canvas = $canvas()
      const context = canvas?.getContext("2d")
      if (!canvas || !context) return
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}