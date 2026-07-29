import { For, Style, css, If, Else, Thru } from "luent"
import { Ion, ion } from "@luent/quarky"

// Modified Demo from Vue.js
// barebones cells app


export function CellsApp() {
   const COLS = 6
   const ROWS = 10

   const cells = Array.from(Array(COLS).keys()).map((i) =>
      Array.from(Array(ROWS).keys()).map((i) => ''))

   const cols = cells.map((_, i) => String.fromCharCode(65 + i))
   const tds: HTMLTableCellElement[][] = []

   function evalCell(exp: string) {
      if (!exp.startsWith('=')) {
         return exp
      }

      // = A1 + B2 ---> get(0,1) + get(1,2)
      exp = exp
         .slice(1)
         .replace(
            /\b([A-Z])(\d{1,2})\b/g,
            (_, c, r) => `get(${c.charCodeAt(0) - 65},${r})`
         )

      try {
         return new Function('get', `return ${exp}`)(getCellValue)
      } catch (e) {
         return `#ERROR ${e}`
      }
   }

   function getCellValue(c: number, r: number) {
      const val = evalCell(cells[c][r])
      const num = Number(val)
      return Number.isFinite(num) ? num : val
   }

   return (

      <>
         <table>
            <thead>
               <tr>
                  <th></th>
                  {For(cols, $col =>
                     <th>{$col}</th>
                  )}
               </tr>
            </thead>
            <tbody>
               {Thru(cells[0].length, (_, row: any) => (
                  <tr>
                     <th>{row}</th>
                     {Thru(cols.length, (_, col: any) =>
                        <td ref={[tds, [row, col]]}>
                           <Cell
                              value={(cells[col][row])}
                              setCellValue={value => { cells[col][row] = value }}
                              calcCellValue={evalCell}
                           ></Cell>
                        </td>
                     )}
                  </tr>
               ))}
            </tbody>
         </table >
         {Style(css`
            body {
               margin: 0;
            }
         
            table {
               border-collapse: collapse;
               table-layout: fixed;
               width: 100%;
            }
         
            th {
               background-color: #eee;
            }
         
            tr:first-of-type th {
               width: 100px;
            }
         
            tr:first-of-type th:first-of-type {
               width: 25px;
            }
         
            td {
               border: 1px solid #ccc;
               height: 1.5em;
               overflow: hidden;
            }
         `)}
      </>
   )
}


function Cell(input: {
   value: Ion<string>
   setCellValue: (value: string) => void
   calcCellValue: (value: string) => string
}) {
   const { setCellValue, $value, calcCellValue } = input

   const $editing = ion(false)

   function update(e: any) {
      $editing.value = false
      setCellValue(e.target.value.trim())
   }

   return (

      <>
         <div class="cell" title={$value} on:click={e => { $editing.value = true }}>
            {If($editing,
               <input
                  value={$value}
                  on:change={update}
                  on:blur={update}
                  at:attach={el => el.focus()}
               />
            )}
            {Else(
               <span>{calcCellValue($value())}</span>
            )}
         </div >
         {Style(css`
            .cell, .cell input {
               height: 1.5em;
               line-height: 1.5;
               font-size: 15px;
            }

            .cell span {
               padding: 0 6px;
            }

            .cell input {
               width: 100%;
               box-sizing: border-box;
            }
         `)}
      </>
   )
}




