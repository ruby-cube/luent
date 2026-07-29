import { component, css, For, template, Style } from "luent";
import { ionic, ion } from "@luent/quarky";

export function TestRetracking() {
   
   const $todos = ion(ionic([
      ionic({ id: 1, title: 'kermit', completed: false }),
      ionic({ id: 2, title: 'sir robin', completed: false })
   ]))
   const $activeTodos = ion(() => $todos().filter(todo => !todo.completed))

   const $remaining = ion(() => $activeTodos().length)

   function checkAll() {
      $todos().forEach(todo => todo.completed = true)
   }
   function uncheckAll() {
      $todos().forEach(todo => todo.completed = false)
   }
   return (

      <>
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
      {Style(css`
         .item {
            border: 1px solid lightgray;
            padding: 1em;
         }
      `)}
      </>
   )
}