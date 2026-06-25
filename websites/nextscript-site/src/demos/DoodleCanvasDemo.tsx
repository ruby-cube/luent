import { Code, DemoContainer } from '@rue/websites-shared'
import { DoodleCanvas } from "./DoodleCanvas"
import { highlightCode } from "../highlighter"
import { ion } from '@rue/quarky'

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
      <DemoContainer>
        <DoodleCanvas />
      </DemoContainer>
      <Code
        trusted
        main={{ name: 'ns', code: nsKit }}
        alt={{ name: 'ts', code: tsKit, lang: 'ts' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
      <Code
        trusted
        main={{ name: 'nsx', code: nsx }}
        alt={{ name: 'tsx', code: tsx, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
        tab={$tab}
      />
    </>
  )
}

const nsKit =
  `import { NodeRef } from "@rue/luent"
  
function DoodleCanvasKit() {
  get canvas = NodeRef("canvas")

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

  type DrawEvent = { clientX: number, clientY: number }

  function getMousePosition(e: DrawEvent) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect()

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  return {
    canvas@,

    startDrawing(e: DrawEvent) {
      const point = getMousePosition(e)
      if (!point) return;

      isDrawing = true
      lastX = point.x
      lastY = point.y
    },

    draw(e: DrawEvent) {
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
  `import { NodeRef } from "@rue/luent"
  
function DoodleCanvasKit() {
  const $canvas = NodeRef("canvas")

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

  type DrawEvent = { clientX: number, clientY: number }

  function getMousePosition(e: DrawEvent) {
    const canvas = $canvas()
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect()

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  return {
    $canvas,

    startDrawing(e: DrawEvent) {
      const point = getMousePosition(e)
      if (!point) return;

      isDrawing = true
      lastX = point.x
      lastY = point.y
    },

    draw(e: DrawEvent) {
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
  `import { component, css, Style } from "@rue/luent"
import { DoodleCanvasKit } from "./DoodleCanvasKit"
  
function DoodleCanvas() {
  const { 
    canvas@, 
    startDrawing, 
    draw, 
    stopDrawing, 
    clearCanvas 
  } = DoodleCanvasKit()
  
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
  `import { component, css, Style } from "@rue/luent"
import { DoodleCanvasKit } from "./DoodleCanvasKit"
  
function DoodleCanvas() {
  const { 
    $canvas, 
    startDrawing, 
    draw, 
    stopDrawing, 
    clearCanvas 
  } = DoodleCanvasKit()

  return component(
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
