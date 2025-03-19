import { component } from "@rue/lumo"
import { ion } from "@rue/quarky"

export function SevenGUIs() {
   return component(
      <>
      {/* <TemperatureApp></TemperatureApp> */}
      <FlightBooker></FlightBooker>
      </>
   )
}

function TemperatureApp() {
   const $c = ion(0)
   const $f = ion(32)

   function setC(e, v = +e.target.value) {
      $c.state = v
      $f.state = v * (9 / 5) + 32
   }

   function setF(e, v = +e.target.value) {
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

   function stringToDate(str) {
      const [y, m, d] = str.split('-')
      return new Date(+y, m - 1, +d)
   }

   function dateToString(date) {
      return (
         date.getFullYear() +
         '-' +
         pad(date.getMonth() + 1) +
         '-' +
         pad(date.getDate())
      )
   }

   function pad(n, s = String(n)) {
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