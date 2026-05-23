
import { atMounted, For, If, Style } from "@rue/luent"
import { component, template, atUnmount } from "@rue/luent"
import {  Ion, ion, popUpdate, pushUpdate, SYNC,watch } from "@rue/quarky"

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
   const $c = ion(0)
   const $f = ion(() => $c() * (9 / 5 + 32),
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
         <input type="date" mu:value={$returnDate} disabled={(!$isReturn())} />

         <button disabled={(!$canBook())} on:click={book}>Book</button>

         <p>{($canBook() ? '' : 'Return date must be after departure date.')}</p>
      </>

   )
}

// <o-style scoped="flight-booker">
//    select,
//    input,
//    button {
//       display: `$display`;
//       margin: 0.5em 0;
//       font-size: 15px;
//    }

//    input[disabled] {
//       color: #999;
//    }

//    p {
//       color: red;
//    }
// </o-style>,

// style('flight-booker').css`
//    select,
//    input,
//    button {
//       display: ${$display};
//       margin: 0.5em 0;
//       font-size: 15px;
//    }

//    input[disabled] {
//       color: #999;
//    }

//    p {
//       color: red;
//    }
// `

function TimerApp() {
   const $duration = ion(15 * 1000)
   const $elapsed = ion(0)

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

   const $progressRate = ion(() =>
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


// function OnEventFlow(obj: { [key: string]: Function } | any) {
//    const update = createSwiftUpdate(() => undefined)
//    const onEventFlow: AnyObject = {
//       start() {
//          pushUpdate(update)
//       },
//       end() {
//          popUpdate()
//          if (!update.cancelled) {
//             update.start()
//          }
//       }
//    }
//    for (const key in obj) {
//       onEventFlow[key] = function noWrap(...args: any[]) { tryUpdate(() => obj[key](...args)) }
//    }
//    return onEventFlow
// }

