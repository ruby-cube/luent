import { component, For, If, Style } from "@rue/lumo"
import { Ion, Ionic, EACH } from "@rue/quarky"

// Modified Demo from Vue.js

type Circle = { cx: number, cy: number, r: number }
// type Ionic<T> = T & { '~ionic-proxy': true }


export function CircleApp() {
   const history = Ionic([[]] as Circle[][], { [EACH]: { as: Ionic } })
   const $index = Ion(0)
   const $circles = Ion(Ionic([] as Circle[]))
   const $selected = Ion(undefined as undefined | null | Ionic<Circle>)
   const $adjusting = Ion(false)

   function reClick({ clientX: x, clientY: y, target }: MouseEvent) {
      if ($adjusting()) {
         $adjusting.value = false
         $selected.value = null
         push()
         return;
      }

      if (target?.tagName !== 'circle') mu: $selected.value = null

      if (!$selected()) {
         $circles().push(Ionic({
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
      mu: $circles.value = clone(history[--$index.value])
   }

   function redo() {
      mu: $circles.value = clone(history[++$index.value])
   }

   function clone(circles: Circle[]) {
      return circles.map((circle) => Ionic({ ...circle }))
   }

   return component(
      <>
         <svg on:click={e => reClick(e as any as MouseEvent)}>
            {/* <svg on:click={(e) => { handleClick.svg(e) }}> */}
            <foreignObject x="0" y="40%" width="100%" height="200">
               <p class="tip">
                  Click on the canvas to draw a circle. Click on a circle to select it.
                  Right-click on the canvas to adjust the radius of the selected circle.
               </p>
            </foreignObject>
            {For($circles, circle => (
               <circle
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.$r}
                  fill={(circle === $selected() ? '#ccc' : '#fff')}
                  on:click={e => { mu: $selected.value = circle }}
                  // on:click={e => { handleClick.circle(circle) }}
                  on:contextmenu={e => (e.preventDefault(), adjust(circle))}
               ></circle>)
            )}
         </svg>

         <div class="controls">
            <button on:click={undo} disabled={($index() <= 0)}>Undo</button>
            <button on:click={redo} disabled={($index() >= history.length - 1)}>Redo</button>
         </div>
         {If($adjusting,
            <div class="dialog" on:click={e => e.stopPropagation()}>
               <p>Adjust radius of circle at ({($selected()?.cx)}, {($selected()?.cy)})</p>
               <input
                  type="range"
                  mu:value={($selected()?.$r)}
                  min="1" max="300"
               />
            </div>
         )}
         {Style`
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
            }`}
      </>
   )
}