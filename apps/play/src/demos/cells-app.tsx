import { component, Else, For, fromTag, If, Style } from "@rue/lumo"
import { ion, ionize } from "@rue/quarky"

const COLS = 5
const ROWS = 20

const cells = ionize(
   Array.from(Array(COLS).keys()).map((i) =>
      Array.from(Array(ROWS).keys()).map((i) => '')
   )
)

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

export function CellsApp() {
   const cols = cells.map((_, i) => String.fromCharCode(65 + i))

   return component(
      <>
         <table>
            <thead>
               <tr>
                  <th></th>
                  {For(cols, col =>
                     <th>{col}</th>
                  )}
               </tr>
            </thead>
            <tbody>
               {For([...cells[0]], (_, row) => (//TODO: allow numbers as input for For()
                  <tr>
                     <th>{row}</th>
                     {For(cols, (_, col) =>
                        <td>
                           <Cell row={row} column={col}></Cell>
                        </td>
                     )}
                  </tr>
               ))}
            </tbody>
         </table >
         
         {Style`
            body {
               margin: 0;
            }

            table {
               border - collapse: collapse;
               table-layout: fixed;
               width: 100%;
            }

            th {
               background - color: #eee;
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
         `}
      </>
   )
}


function Cell({ column, row } = fromTag<{
   column: number,
   row: number
}>()) {

   const $editing = ion(false)

   function update(e: any) {
      $editing.state = false
      cells[column][row] = e.target.value.trim()
   }


   return component(
      <>
         <div class="cell" title={cells[column][row]} on:click={e => { console.log('set editing'); $editing.state = true }}>
            {If($editing,
               <input
                  value={cells[column][row]}
                  on:change={update}
                  on:blur={update}
                  at:mounted={el => el.focus()}
               />
            )}
            {Else(
               <span>{evalCell(cells[column][row])}</span>
            )}
         </div >

         {Style`
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
   }`
         }
      </>)
}



