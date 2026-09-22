import { Code, DemoContainer, DoodleCanvas } from '@luent/websites-shared'
import { highlightCode } from "../highlighter"
import { ion } from 'luent'

export function DoodleCanvasDemo() {
  const $tab = ion('main' as 'main' | 'alt', {
    toggle() {
      this.value === 'main'
        ? this.value = 'alt'
        : this.value = 'main'
    }
  })
  return (
    <>
      <DemoContainer style='border: none'>
        {DoodleCanvas()}
      </DemoContainer>
      <Code
        trusted
        filename='DrawingKit'
        main={{ name: 'ts', code: tsKit, lang: 'ts' }}
        alt={{ name: 'ns', code: nsKit }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        filename='DoodleCanvas'
        main={{ name: 'tsx', code: tsx, lang: 'tsx' }}
        alt={{ name: 'nsx', code: nsx }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
    </>
  )
}

const nsKit =
  `import { NodeRef } from "luent"
  
function DrawingKit(canvas@: NodeRef<'canvas'>) {

  let isDrawing = false
  let lastX = 0
  let lastY = 0

  function getContext() {
    if (!canvas) return;

    const context = canvas.getContext("2d")
    if (!context) return;

    context.lineJoin = "round"
    context.lineCap = "round"
    context.lineWidth = 4
    context.strokeStyle = "#111"

    return context;
  }

  function getMousePosition(e: MouseEvent) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect()

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  return {

    startDrawing(e: MouseEvent) {
      const point = getMousePosition(e)
      if (!point) return;

      isDrawing = true
      lastX = point.x
      lastY = point.y
    },

    draw(e: MouseEvent) {
      if (!isDrawing) return;

      const context = getContext()
      const point = getMousePosition(e)
      if (!context || !point) return;

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
      const context = canvas?.getContext("2d")
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  };
}
  


`

const tsKit =
  `import { NodeRef } from "luent"
  
function DrawingKit($canvas: NodeRef<'canvas'>) {

  let isDrawing = false
  let lastX = 0
  let lastY = 0

  function getContext() {
    const canvas = $canvas()
    if (!canvas) return;

    const context = canvas.getContext("2d")
    if (!context) return;

    context.lineJoin = "round"
    context.lineCap = "round"
    context.lineWidth = 4
    context.strokeStyle = "#111"

    return context;
  }

  function getMousePosition(e: MouseEvent) {
    const canvas = $canvas()
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect()

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  return {

    startDrawing(e: MouseEvent) {
      const point = getMousePosition(e)
      if (!point) return;

      isDrawing = true
      lastX = point.x
      lastY = point.y
    },

    draw(e: MouseEvent) {
      if (!isDrawing) return;

      const context = getContext()
      const point = getMousePosition(e)
      if (!context || !point) return;

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
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  };
}`



const nsx =
  `import { component, css, Style } from "luent"
import { DrawingKit } from "./DrawingKit"
  
function DoodleCanvas() {
  get canvas = NodeRef("canvas");

  const { 
    startDrawing, 
    draw, 
    stopDrawing, 
    clearCanvas 
  } = DrawingKit(canvas@)
  
  <:>
    <div class="canvas-app">
      <div class="frame">
        <canvas
          ref={canvas@}
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

    <o-style>
      .canvas-app {
        display: grid;
        gap: 10px;
        margin: 24px auto;
      }

      .frame {
        width: 100%;
        overflow: hidden;
        border-radius: .75rem;
      }
        
      button {
        justify-self: end;
      }
        
      canvas {
        border: none;
        background: #fff;
        cursor: crosshair;
      }
    </o-style>
  </:>
}
    
  `

const tsx =
  `import { component, css, Style } from "luent"
import { DrawingKit } from "./DrawingKit"
  
function DoodleCanvas() {
  const $canvas = NodeRef("canvas");
  
  const { 
    startDrawing, 
    draw, 
    stopDrawing, 
    clearCanvas 
  } = DrawingKit($canvas)

  return (
    <>
      <div class="canvas-app">
        <div class="frame">
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

      <o-style>
        .canvas-app {
          display: grid;
          gap: 10px;
          margin: 24px auto;
        }

        .frame {
          width: 100%;
          overflow: hidden;
          border-radius: .75rem;
        }

        button {
          justify-self: end;
        }

        canvas {
          border: none;
          background: #fff;
          cursor: crosshair;
        }
      </o-style>
    </>
  );
}`
