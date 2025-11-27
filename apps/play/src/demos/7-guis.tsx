
//@ts-nocheck
import { atMounted, For, If, Style } from "@rue/lumo"
import { component, atUnmount } from "@rue/lumo"
import { $$, ion, Ionic, ionic, ionize, Ionized, ions, SYNC, watch } from "@rue/quarky"
import { quarkOf } from "../../../../packages/quarky/src/abstract/Quark"
import { getFlask } from "@rue/flask"

export function SevenGUIs() {
   return component(
      <>
         {/* <CircleApp></CircleApp> */}
         <TemperatureApp></TemperatureApp>
         <hr />
         <FlightBooker></FlightBooker>
         <hr />
         <TimerApp />
         <hr />
         <CRUDApp />
      </>
   )
}


//FIX:
function TemperatureApp() {
   const $c = Ion(0)
   const $f = Ion(() => $c() * (9 / 5 + 32),
      {
         // set state(v: number) {
         //    $c.value = (v - 32) * (5 / 9)
         // },
         set(v: number) {
            $c.value = (v - 32) * (5 / 9)
         }
      })

   function setC(e, v = +e.target!.value) {
      $c.value = v
   }

   function setF(e, v = +e.target!.value) {
      $f.set(v)
      // $f.value = v
   }

   return component(
      <>
         <input type="number" value={$c} on:change={setC} /> Celsius =
         <input type="number" value={$f} on:change={setF} /> Fahrenheit
      </>
   )
}

function FlightBooker() {

   const $flightType = Ion('one-way flight')
   const $departureDate = Ion(dateToString(new Date()))
   const $returnDate = Ion($departureDate())

   const $isReturn = Ion(() => $flightType() === 'return flight')

   const $canBook = Ion(() =>
      !$isReturn() ||
      stringToDate($returnDate()) > stringToDate($departureDate())
   )

   function book() {
      alert(
         $isReturn()
            ? `You have booked a return flight leaving on ${$departureDate()} and returning on ${$returnDate()}.`
            : `You have booked a one-way flight leaving on ${$departureDate()}.`
      )
   }

   function stringToDate(str: string) {
      const [y, m, d] = str.split('-')
      return new Date(+y, Number(m) - 1, +d)
   }

   function dateToString(date: Date) {
      return (
         date.getFullYear() +
         '-' +
         pad(date.getMonth() + 1) +
         '-' +
         pad(date.getDate())
      )
   }

   function pad(n: number, s = String(n)) {
      return s.length < 2 ? `0${s}` : s
   }

   return component(
      <select mu:value={$flightType}>
         <option value="one-way flight">One-way Flight</option>
         <option value="return flight">Return Flight</option>
      </select>,

      <input type="date" mu:value={$departureDate} />,
      <input type="date" mu:value={$returnDate} disabled={(!$isReturn())} />,

      <button disabled={(!$canBook())} on:click={book}>Book</button>,

      <p>{($canBook() ? '' : 'Return date must be after departure date.')}</p>,

      <o-style scoped="flight-booker">
         select,
         input,
         button {
            display: `$display`;
            margin: 0.5em 0;
            font-size: 15px;
         }
      
         input[disabled] {
            color: #999;
         }
      
         p {
            color: red;
         }
      </o-style>,

      style('flight-booker').css`
         select,
         input,
         button {
            display: ${$display};
            margin: 0.5em 0;
            font-size: 15px;
         }
         
         input[disabled] {
            color: #999;
         }
         
         p {
            color: red;
         }
      `
   )
}

function TimerApp() {
   const $duration = Ion(15 * 1000)
   const $elapsed = Ion(0)

   let lastTime: DOMHighResTimeStamp;
   let handle: number;

   const update = () => {
      $elapsed.value = performance.now() - lastTime
      if ($elapsed() >= $duration()) {
         cancelAnimationFrame(handle)
      } else {
         handle = requestAnimationFrame(update)
      }
   }

   const reset = () => {
      $elapsed.value = 0
      lastTime = performance.now()
      update()
   }

   const $progressRate = Ion(() =>
      Math.min($elapsed() / $duration(), 1)
   )

   reset()

   atUnmount(() => {
      cancelAnimationFrame(handle)
   })

   return component(
      <>
         <label>Elapsed Time: <progress value={$progressRate}></progress></label>

         <div>{(($elapsed() / 1000).toFixed(1))}s</div>

         <div>
            Duration: <input type="range" mu:value={$duration} min="1" max="30000" />
            {(($duration() / 1000).toFixed(1))}s
         </div>

         <button on:click={reset}>Reset</button>

         {Style`
                  .elapsed-container {
                     width: 300px;
                     background-color: red;
                  }

                  .elapsed-bar {
                     background-color: red;
                     height: 10px;
                  }
               `}
      </>
   )
}

function css(str: TemplateStringsArray) {
   return str[0] as any
}

// FIX: selected state disappears after clicking update
export function CRUDApp() {

   const names = Ionic(['Emil, Hans', 'Mustermann, Max', 'Tisch, Roman'])
   const $selected = Ion('')
   const $prefix = Ion('')
   const $first = Ion('')
   const $last = Ion('')
   const $fullName = () => `${$last()}, ${$first()}` //FIX: this can easily be mistaken for an ion.

   watch($selected, ({ current }) => {
      [$last.value, $first.value] = current.split(', ')
   }, { phase: SYNC })

   // watch(names, () => { // TODO: this is a stand-in to initialize pions for .filter. Figure out why .filter is not initializing pions
   //    console.log('names updated')
   // })
   const proxyProto = quarkOf(names).proxyProto
   // console.log('before', Object.getOwnPropertyDescriptors(proxyProto))
   console.log('before', proxyProto)

   const $filteredNames = Ion(() => {
      const res = names.filter((n) =>
         n.toLowerCase().startsWith($prefix().toLowerCase())
      )
      console.log('!!!after filter', quarkOf(names))
      return res;
   })


   function create() {
      if (hasValidInput()) {
         const fullName = $fullName()
         if (!names.includes(fullName)) {
            names.push(fullName)
            $first.value = $last.value = ''
         }
      }
   }

   //   if (hasValidInput() && selected.value) {
   //     const i = names.indexOf(selected.value)
   //     names[i] = selected.value = `${last.value}, ${first.value}`
   //   }

   function update() {
      if (hasValidInput() && $selected()) {
         const i = names.indexOf($selected())
         console.log('index', i)
         names[i] = $selected.value = $fullName()
      }
   }

   function del() {
      if ($selected()) {
         const i = names.indexOf($selected())
         names.splice(i, 1)
         $selected.value = ''
         console.log('delete first', $first())
         console.log('delete last', $last())
         console.log('delete selected', $selected())
      }
   }

   function hasValidInput() {
      return $first().trim() && $last().trim()
   }

   atMounted(() => {
      console.log('after', quarkOf(names).proxyProto)
      console.log('after', Object.getOwnPropertyDescriptors(quarkOf(names).proxyProto))
   })


   return component(
      <>
         <div><input mu:value={$prefix} placeholder="Filter prefix" /></div>

         <select size={5} mu:value={$selected}>
            {For($filteredNames, name =>
               <option>{name}</option>
            )}
         </select >

         <label>Name: <input mu:value={$first} /></label>
         <label>Surname: <input mu:value={$last} /></label>

         <div class="buttons">
            <button on:click={create}>Create</button>
            <button on:click={update} > Update</button >
            <button on:click={del} > Delete</button >
         </div >

         {For($filteredNames, name =>
            <div>{name}</div>
         )}
         {Style`
   * {
      font-size: inherit;
   }

input {
   display: block;
  margin-bottom: 10px;
}

select {
   float: left;
   margin: 0 1em 1em 0;
   width: 14em;
}

.buttons {
   clear: both;
}

button + button {
   margin-left: 5px;
}
`}
      </>


   )
}

type Circle = { cx: number, cy: number, r: number }

export function CircleApp() {
   const history = ionize([[]] as Circle[][])
   const $index = Ion(0)
   const $circles = ion.ionize([] as Circle[])
   const $selected = ion.ionize(undefined as undefined | null | Circle)
   const $adjusting = Ion(false)

   function reClick({ clientX: x, clientY: y }: MouseEvent) {
      if ($adjusting()) {
         $adjusting.value = false
         $selected.value = null
         push()
         return
      }

      $selected.value = ionize([...$circles()].reverse().find(({ cx, cy, r }) => {
         const dx = cx - x
         const dy = cy - y
         return Math.sqrt(dx * dx + dy * dy) <= r
      }))

      if (!$selected()) {
         $circles().push({
            cx: x,
            cy: y,
            r: 50
         })
         push()
      }
   }

   function adjust(circle: Ionized<Circle>) {
      $selected.value = circle
      $adjusting.value = true
   }

   function push() {
      history.length = ++$index.value
      history.push(clone($circles()))
      // console.log(toRaw(history))
   }

   function undo() {
      $circles.value = ionize(clone(history[--$index.value]))
   }

   function redo() {
      $circles.value = ionize(clone(history[++$index.value]))
   }

   function clone(circles: Circle[]) {
      return circles.map((c) => ({ ...c }))
   }
   return component(
      <>
         <svg on:click={e => reClick(e)}>
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
                  on:click={e => $selected.value = circle}
                  on:contextmenu={e => (e.preventDefault(), adjust(circle))}
               ></circle>)
            )}
         </svg>

         <div class="controls">
            <button on:click={undo} disabled={($index() <= 0)}>Undo</button>
            <button on:click={redo} disabled={($index() >= history.length - 1)}>Redo</button>
         </div>
         {If($adjusting, (selected = $selected()!) =>
            <div class="dialog" on:click={e => e.stopPropagation()}>
               <p>Adjust radius of circle at ({selected.cx}, {selected.cy})</p>
               <input
                  type="range"
                  mu:value={selected.$r}
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