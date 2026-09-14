import { For, If, Style, css, $of } from "luent"
import { ion, Ionic, ionic } from "@luent/quarky"

// Modified Demo from Vue.js

type Circle = { cx: number, cy: number, r: number }

export function CircleApp() {
  const history = ionic([ionic([] as Ionic<Circle>[])])
  const $index = ion(0)
  const $circles = ion(ionic([] as Ionic<Circle>[]))
  const $selected = ion(undefined as undefined | null | Ionic<Circle>)
  const $adjusting = ion(false)

  function reClick({ clientX: x, clientY: y, target }: MouseEvent) {
    if ($adjusting()) {
      $adjusting.value = false
      if ($selected()?.r !== $selected()?.r)
        push()
      $selected.value = null
      return;
    }

    if ((target as HTMLElement)?.tagName !== 'circle')
      $selected.value = null

    if (!$selected()) {
      $circles().push(ionic({
        cx: x,
        cy: y,
        r: 50
      }))
      push()
    }
  }

  function adjust(circle: Ionic<Circle>) {
    $selected.value = circle
    $adjusting.value = true
  }

  function push() {
    history.length = ++$index.value
    history.push(clone($circles()))
  }

  function undo() {
    $circles.value = clone(history[--$index.value])
  }

  function redo() {
    $circles.value = clone(history[++$index.value])
  }

  function clone(circles: Ionic<Circle[]>) {
    return circles.map((circle) => ionic({ ...circle }))
  }

  const circle = $circles()[0]

  return (

    <>
      <svg on:click={reClick}>
        <foreignObject x="0" y="40%" width="100%" height="200">
          <p class="tip">
            Click on the canvas to draw a circle. Click on a circle to select it.
            Right-click on the canvas to adjust the radius of the selected circle.
          </p>
        </foreignObject>
        {For($circles, m => m, circle => (
          <circle
            cx={circle.cx}
            cy={circle.cy}
            r={circle.$r}
            fill={(circle === $selected() ? '#ccc' : '#fff')}
            on:click={e => { $selected.value = circle }}
            on:contextmenu={e => (e.preventDefault(), adjust(circle))}
          ></circle>)
        )}
      </svg>

      <div class="controls">
        <button on:click={undo} disabled={($index() <= 0)}>Undo</button>
        <button on:click={redo} disabled={($index() >= history.length - 1)}>Redo</button>
      </div>
      {If($adjusting, () => {
        // const $radius = ion(() => $selected()?.r, {
        //   '@set'(value: number) { if ($selected()) $selected()!.r = value }
        // })
        const selected = {} as any
        return <div class="dialog" on:click={e => e.stopPropagation()}>
          <p>Adjust radius of circle at ({($selected()?.cx)}, {($selected()?.cy)})</p>
          <input
            type="range"
            mu:value={(selected?.r@)@}
            // mu:value={() => $of($selected())?.r}
          min="1" max="300"
          />
        </div>
      }
      )}
      {Style(css`
            body {
               margin: 0;
               overflow: hidden;
            }
         
            svg {
              width: 100vw;
              height: 100vh;
              background-color: #eee;
            }
         
            circle {
               stroke: #000;
            }
         
            .controls {
               position: fixed;
               top: 10px;
               left: 0;
               right: 0;
               text-align: center;
            }
         
            .controls button + button {
               margin-left: 6px;
            }
         
            .dialog {
               position: fixed;
               top: calc(50% - 50px);
               left: calc(50% - 175px);
               background: #fff;
               width: 350px;
               height: 100px;
               padding: 5px 20px;
               box-sizing: border-box;
               border-radius: 4px;
               text-align: center;
               box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.25);
            }
         
            .dialog input {
               display: block;
               width: 200px;
               margin: 0px auto;
            }
         
            .tip {
               text-align: center;
               padding: 0 50px;
               color: #bbb;
            }
      `)}
    </>
  )
}