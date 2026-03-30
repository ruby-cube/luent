import { css, For, template } from "@rue/lumo";
import { Ion, Ionic } from "@rue/quarky";
import { watch } from "fs";

export function TestRetracking() {
   
   const $todos = Ion(Ionic([
      Ionic({ id: 1, title: 'kermit', completed: false }),
      Ionic({ id: 2, title: 'sir robin', completed: false })
   ]))
   const $activeTodos = Ion(() => $todos().filter(todo => !todo.completed))

   const $remaining = Ion(() => $activeTodos().length)

   function checkAll() {
      $todos().forEach(todo => todo.completed = true)
   }
   function uncheckAll() {
      $todos().forEach(todo => todo.completed = false)
   }
   return template(
      <div>
         <button on:click={checkAll}>checkAll</button>
         <button on:click={uncheckAll}>uncheckAll</button>
         {For($todos, m => m.id, (todo) => (
            <div class='item' on:click={e => (todo.completed = !todo.completed)}>{(todo.completed)} {todo.title}</div>
         ))}
         <div>{$remaining}</div>
         <hr></hr>
         {For($activeTodos, m => m.id, (todo) => (
            <div on:click={e => (todo.completed = !todo.completed)}>{(todo.completed)} {todo.title}</div>
         ))}
      </div>
   )
   .style(css`
         .item {
            border: 1px solid lightgray;
            padding: 1em;
         }
      `)
}