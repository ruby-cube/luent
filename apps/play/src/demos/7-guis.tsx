import { For, If } from "@rue/lumo"
import { component, onUnmount } from "@rue/lumo"
import { $$, ion, ionize, ions, watch } from "@rue/quarky"

export function SevenGUIs() {
   return component(
      <>
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



function TemperatureApp() {
   const $c = ion(0)
   const $f = ion(32)

   function setC(e, v = +e.target!.value) {
      $c.state = v
      $f.state = v * (9 / 5) + 32
   }

   function setF(e, v = +e.target!.value) {
      $f.state = v
      $c.state = (v - 32) * (5 / 9)
   }
   return component(
      <>
         <input type="number" value={$c} on:change={setC} /> Celsius =
         <input type="number" value={$f} on:change={setF} /> Fahrenheit
      </>
   )
}

function FlightBooker() {

   const $flightType = ion('one-way flight')
   const $departureDate = ion(dateToString(new Date()))
   const $returnDate = ion($departureDate())

   const $isReturn = ion(() => $flightType() === 'return flight')

   const $canBook = ion(() =>
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
      <>
         <select mu:value={$flightType}>
            <option value="one-way flight">One-way Flight</option>
            <option value="return flight">Return Flight</option>
         </select>

         <input type="date" mu:value={$departureDate} />
         <input type="date" mu:value={$returnDate} disabled={!$isReturn()} />

         <button disabled={!$canBook()} on:click={book}>Book</button>

         <p>{$canBook() ? '' : 'Return date must be after departure date.'}</p>

         <$--portal to='head'>
            <style>{`
            select,
            input,
            button {
               display: block;
            margin: 0.5em 0;
            font-size: 15px;
      }

            input[disabled] {
               color: #999;
      }

            p {
               color: red;
      }
            
         `}</style>
         </$--portal>
      </>
   )
}

function TimerApp() {
   const $duration = ion(15 * 1000)
   const $elapsed = ion(0)

   let lastTime: DOMHighResTimeStamp;
   let handle: number;

   const update = () => {
      $elapsed.state = performance.now() - lastTime
      if ($elapsed() >= $duration()) {
         cancelAnimationFrame(handle)
      } else {
         handle = requestAnimationFrame(update)
      }
   }

   const reset = () => {
      $elapsed.state = 0
      lastTime = performance.now()
      update()
   }

   const $progressRate = ion(() =>
      Math.min($elapsed() / $duration(), 1)
   )

   reset()

   onUnmount(() => {
      cancelAnimationFrame(handle)
   })

   return component(
      <>
         <label>Elapsed Time: <progress value={$progressRate}></progress></label>

         <div>{($elapsed() / 1000).toFixed(1)}s</div>

         <div>
            Duration: <input type="range" mu:value={$duration} min="1" max="30000" />
            {($duration() / 1000).toFixed(1)}s
         </div>

         <button on:click={reset}>Reset</button>

         <$--portal to='head'>
            <style>
               {css`
                  .elapsed-container {
                     width: 300px;
                     background-color: red;
                  }

                  .elapsed-bar {
                     background-color: red;
                     height: 10px;
                  }
               `}
            </style>
         </$--portal>
      </>
   )
}

function css(str: TemplateStringsArray) {
   return str[0] as any
}

function CRUDApp() {

   const names = ionize(['Emil, Hans', 'Mustermann, Max', 'Tisch, Roman'])
   const $selected = ion('')
   const $prefix = ion('')
   const $first = ion('')
   const $last = ion('')

   const $filteredNames = ion(() =>
      names.filter((n) =>
         n.toLowerCase().startsWith($prefix().toLowerCase())
      )
   )

   watch($selected, ({ state: name }) => {
      [$last.state, $first.state] = name.split(', ')
      console.log('split name', $first.state)
   })

   function create() {
      if (hasValidInput()) {
         const fullName = `${$last()}, ${$first()}`
         if (!names.includes(fullName)) {
            names.push(fullName)
            $first.state = $last.state = ''
         }
      }
   }

   function update() {
      if (hasValidInput() && $selected()) {
         const i = names.indexOf($selected())
         names[i] = $selected.state = `${$last()}, ${$first()}`
      }
   }

   function del() {
      if ($selected()) {
         const i = names.indexOf($selected())
         names.splice(i, 1)
         $selected.state = $first.state = $last.state = ''
      }
   }

   function hasValidInput() {
      return $first().trim() && $last().trim()
   }

   return component(
      <>
         <div><input mu:value={$prefix} placeholder="Filter prefix" /></div>

         <select size={5} mu:value={$selected}>
            {For($filteredNames, name =>
               <option >{name}</option>
            )}
         </select >

         <label>Name: <input mu:value={$first} /></label>
         <label>Surname: <input mu:value={$last} /></label>

         <div class="buttons">
            <button on:click={create}>Create</button>
            <button on:click={update} > Update</button >
            <button on:click={del} > Delete</button >
         </div >
         <$--portal to='head'>
            <style>{`
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
`}</style>
         </$--portal>
      </>


   )
}

type Circle = { cx: number, cy: number, r: number }

function CircleApp() {
   const history = ionize([[]] as Circle[][])
   const $index = ion(0)
   const $circles = ion.ionize([] as Circle[])
   const $selected = ion(undefined as undefined | null | Circle)
   const $adjusting = ion(false)

   function reClick({ clientX: x, clientY: y }: MouseEvent) {
      if ($adjusting()) {
         $adjusting.state = false
         $selected.state = null
         push()
         return
      }

      $selected.state = [...$circles()].reverse().find(({ cx, cy, r }) => {
         const dx = cx - x
         const dy = cy - y
         return Math.sqrt(dx * dx + dy * dy) <= r
      })

      if (!$selected()) {
         $circles().push({
            cx: x,
            cy: y,
            r: 50
         })
         push()
      }
   }

   function adjust(circle: Circle) {
      $selected.state = circle
      $adjusting.state = true
   }

   function push() {
      history.length = ++$index.state
      history.push(clone($circles()))
      // console.log(toRaw(history))
   }

   function undo() {
      $circles.state = clone(history[--$index.state])
   }

   function redo() {
      $circles.state = clone(history[++$index.state])
   }

   function clone(circles: Circle[]) {
      return circles.map((c) => ({ ...c }))
   }
   return component(
      <>
         <svg on:click={reClick}>
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
                  r={$$(circle).$r}
                  fill={circle === $selected() ? '#ccc' : '#fff'}
                  on:click={e => $selected.state = circle}
                  on:contextmenu={e => (e.preventDefault(), adjust(circle))}
               ></circle>)
            )}
         </svg>

         <div class="controls">
            <button on:click={undo} disabled={$index() <= 0}>Undo</button>
            <button on:click={redo} disabled={$index() >= history.length - 1}>Redo</button>
         </div>
         {If($adjusting, (selected = $selected()!) =>
            <div class="dialog" on:click={e => e.stopPropagation()}>
               <p>Adjust radius of circle at ({selected.cx}, {selected.cy})</p>
               <input
                  type="range"
                  mu:value={$$(selected).$r}
                  min="1" max="300"
               />
            </div>
         )}
         <$--portal to='head'>
            <style>{`
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
            </style>
         </$--portal>
      </>
   )
}