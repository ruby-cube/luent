import { component, template, For, Style, css } from "@rue/luent"
import { ionic, ion, PRELUDE, watch } from "@rue/quarky"

// Adapted from Vue's CRUDApp demo

export function CRUDApp() {

   const names = ionic(['Emil, Hans', 'Mustermann, Max', 'Tisch, Roman'])
   const $selected = ion('')
   const $filterKey = ion('')
   const $first = ion('')
   const $last = ion('')
   const $fullName = ion(() => `${$last()}, ${$first()}`)

   watch($selected, ({ current }) => {
      [$last.value, $first.value] = current.split(', ')
   }, { phase: PRELUDE })

   const $filteredNames = ion(() => names.filter((n) =>
      n.toLowerCase().indexOf($filterKey().toLowerCase()) > -1
   ))

   function create() {
      if (hasValidInput()) {
         const fullName = $fullName()
         if (!names.includes(fullName)) {
            names.push(fullName);
            [$last.value, $first.value] = fullName.split(' ')
            $selected.value = fullName
         }
      }
      $filterKey.value = ""
   }

   function update() {
      if (hasValidInput() && $selected()) {
         const i = names.indexOf($selected())
         names[i] = $selected.value = $fullName()
      }
   }

   function del() {
      if ($selected()) {
         const i = names.indexOf($selected())
         names.splice(i, 1)
         $selected.value = ''
      }
   }

   function hasValidInput() {
      return $first().trim() && $last().trim()
   }

   return (

      <>
         <div><input mu:value={$filterKey} placeholder="Filter" /></div>

         <select size={5} mu:value={$selected}>
            {For($filteredNames, name =>
               <option>{name}</option>
            )}
         </select >

         <label>Name: <input mu:value={$first} /></label>
         <label>Surname: <input mu:value={$last} /></label>

         <div class="buttons">
            <button on:click={create}>Create</button>
            <button on:click={update}> Update</button >
            <button on:click={del}> Delete</button >
         </div >

         {For($filteredNames, name =>
            <div>{name}</div>
         )}
         {Style(css`
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
         `)}
      </>
   )
}