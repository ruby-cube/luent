import { NodeRef, css, template } from "@rue/lumo";


export function TestCanvas() {
   const $canvas = NodeRef("canvas")
   type DrawEvent = { clientX: number, clientY: number }

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

   function getMousePosition(e: DrawEvent) {
      const canvas = $canvas()
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()

      return {
         x: e.clientX - rect.left,
         y: e.clientY - rect.top
      }
   }

   function startDrawing(e: DrawEvent) {
      const point = getMousePosition(e)
      if (!point) return

      isDrawing = true
      lastX = point.x
      lastY = point.y
   }

   function draw(e: DrawEvent) {
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
   }

   function stopDrawing() {
      isDrawing = false
   }

   function clearCanvas() {
      const canvas = $canvas()
      const context = canvas?.getContext("2d")
      if (!canvas || !context) return
      context.clearRect(0, 0, canvas.width, canvas.height)
   }

   return template(
      <div class="canvas-app">
         <button type="button" on:click={clearCanvas}>Clear</button>
         <canvas
            ref={$canvas}
            width="900"
            height="500"
            on:mousedown={startDrawing}
            on:mousemove={draw}
            on:mouseup={stopDrawing}
            on:mouseleave={stopDrawing}
         ></canvas>
      </div>
   )
      .style(css`
         .canvas-app {
            display: grid;
            gap: 10px;
            width: fit-content;
            margin: 24px auto;
         }

         button {
            width: 90px;
            padding: 6px 10px;
            cursor: pointer;
         }

         canvas {
            border: 1px solid #ccc;
            background: #fff;
            cursor: crosshair;
         }
      `)
}

