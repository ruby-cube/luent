
import { component, fromTag, Ion, v } from '@rue/lumo'
import { ion } from '@rue/quarky'


function SortableTableApp() {
   const searchQuery = ion('')
   const gridColumns = ['name', 'power']
   const gridData = [
      { name: 'Chuck Norris', power: Infinity },
      { name: 'Bruce Lee', power: 9000 },
      { name: 'Jackie Chan', power: 7000 },
      { name: 'Jet Li', power: 8000 }
   ]

   return component(
      <>
         <form id="search">
            Search <input name="query" mu:value={searchQuery} />
         </form>
         <SortableTable
            data={gridData}
            columns={gridColumns}
            filterKey={searchQuery}>
         </SortableTable >
      </>
   )
}


function SortableTable(input = fromTag({
   data: v<any[]>,
   columns: v<string[]>,
   filterKey: Ion<string>
})) {

   const $sortKey = ion('')
   const $sortOrders = ion(
      input.columns.reduce((o, key) => ((o[key] = 1), o), {})
   )

   const filteredData = computed(() => {
      let { data, $filterKey } = input
      if ($filterKey) {
         filterKey = $filterKey().toLowerCase()
         data = data.filter((row) => {
            return Object.keys(row).some((key) => {
               return String(row[key]).toLowerCase().indexOf(filterKey) > -1
            })
         })
      }
      const key = $sortKey()
      if (key) {
         const order = $sortOrders()[key]
         data = data.slice().sort((a, b) => {
            a = a[key]
            b = b[key]
            return (a === b ? 0 : a > b ? 1 : -1) * order
         })
      }
      return data
   })

   function sortBy(key: string) {
      $sortKey.state = key
      $sortOrders.value[key] *= -1
   }

   function capitalize(str: string) {
      return str.charAt(0).toUpperCase() + str.slice(1)
   }

   return component(

      <table v-if="filteredData.length">
         <thead>
            <tr>
               <th v-for="key in columns"
             @click="sortBy(key)"
               :class="{active: sortKey == key }">
               {{ capitalize(key) }}
               <span class="arrow" :class="sortOrders[key] > 0 ? 'asc' : 'dsc'">
            </span>
         </th>
      </tr>
       </thead >
      <tbody>
         <tr v-for="entry in filteredData">
            <td v-for="key in columns">
               {{ entry[key]}}
            </td>
         </tr>
      </tbody>
     </table >
      <p v-else>No matches found.</p>
   )
}
