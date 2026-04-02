
import { template, Else, For, FromTag, If } from '@rue/luent'
import { asIonic, Ion, Ionic } from '@rue/quarky'
import { AnyObject } from '@rue/types'
import "./style.css"
import "./SortableTable.css"


export function SortableTableApp() {
   
   const $searchQuery = Ion('')
   const gridColumns = ['name', 'power']
   const gridData = [
      { name: 'Chuck Norris', power: Infinity },
      { name: 'Bruce Lee', power: 9000 },
      { name: 'Jackie Chan', power: 7000 },
      { name: 'Jet Li', power: 8000 }
   ]

   return template(
      <>
         <form id="search">
            Search <input name="query" mu:value={$searchQuery} />
         </form>
         <SortableTable
            data={gridData}
            columns={gridColumns}
            filterKey={$searchQuery}>
         </SortableTable >
         <o--link href='/src/demos/sortable-table.css' rel='stylesheet' />
      </>
   )
}

type SortableTableInput = FromTag<{
   data: any[],
   columns: string[],
   filterKey: Ion<string>
}>

function SortableTable({ columns, data, $filterKey }: SortableTableInput) {

   const $sortKey = Ion('')
   const sortOrders = asIonic(columns.reduce((o: AnyObject, key) => ((o[key] = 1), o), {}))

   const $filteredData = Ion(() => {
      let filteredData = data;
      let filterKey = $filterKey()
      const key = $sortKey()

      if (filterKey) {
         filterKey = filterKey.toLowerCase()
         filteredData = filteredData.filter((row) => {
            return Object.keys(row).some((key) => {
               return String(row[key]).toLowerCase().indexOf(filterKey) > -1
            })
         })
      }

      if (key) {
         const order = sortOrders[key]
         filteredData = filteredData.slice().sort((a, b) => {
            a = a[key]
            b = b[key]
            return (a === b ? 0 : a > b ? 1 : -1) * order
         })
      }

      return filteredData
   })

   function sortBy(key: string) {
      $sortKey.value = key
      sortOrders[key] *= -1
   }

   function capitalize(str: string) {
      return str.charAt(0).toUpperCase() + str.slice(1)
   }

   return template(
      <>
         {If(($filteredData().length),
            <table>
               <thead>
                  <tr>
                     {For(columns, key => (
                        <th on:click={e => sortBy(key)} class={{ active: ($sortKey() == key) }}>
                           {capitalize(key)}
                           <span class={(`arrow ${sortOrders[key] > 0 ? 'asc' : 'dsc'}`)}></span>
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {For($filteredData, $entry => (
                     <tr>
                        {For(columns, key => (
                           <td>{($entry()[key])}</td>
                        ))}
                     </tr>
                  ))}
               </tbody>
            </table>
         )}
         {Else(
            <p>No matches found</p>
         )}
      </>
   )
}
