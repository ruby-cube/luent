//@ts-nocheck
import { component, For, If, Else } from "@rue/lumo"
import { watch, ion, ionicTask, ionize, Ionized, ionic } from "@rue/quarky"
import { PRERENDER } from "../../../../packages/lumo/src/render-cycle"

type Ionz<T extends object> = Ionized<T>

interface Todo {
   id: number
   title: string
   completed: boolean
}

type InputEvent = { target: { value: string }, key: string }
type RadioInputEvent = { target: { checked: boolean } }


export function TodoMVC() {

   const STORAGE_KEY = 'vue-todomvc'

   const filters = {
      all: (todos: Ionz<Todo[]>) => todos,
      active: (todos: Ionz<Todo[]>) => ionize(todos.filter(todo => !todo.completed)),
      completed: (todos: Ionz<Todo[]>) => ionize(todos.filter(todo => todo.completed))
   }

   // get state
   let $todos = ion.ionize((JSON.parse(localStorage.getItem(STORAGE_KEY)!) || []) as Todo[])
   let $view = ion('all' as keyof typeof filters)
   let $editedTodo = ion(null as Todo | null)

   // derived state
   const $filteredTodos = ion(() => filters[$view]($todos))

   const $remaining = ion(() => filters.active($todos).length)

   // handle routing
   window.addEventListener('hashchange', onHashChange)
   onHashChange()

   // persist state
   ionicTask(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify($todos)) //FIX: not reactive
   }, { phase: PRERENDER })

   function toggleAll(e: RadioInputEvent) {
      $todos.forEach(todo => { $$: todo.completed = e.target.checked })
   }

   function addTodo(e: InputEvent) {
      const value = e.target.value.trim()
      if (value) {
         $$: $todos.push({
            id: Date.now(),
            title: value,
            completed: false
         })
         e.target.value = ''
      }
   }

   function removeTodo(todo: Ionz<Todo>) {
      const index = $todos.indexOf(todo)
      $$: $todos.splice(index, 1)
   }

   let beforeEditCache = ''
   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      $$: $editedTodo = todo
   }

   function cancelEdit(todo: Todo) {
      $$: $editedTodo = null
      $$: todo.title = beforeEditCache
   }

   function doneEdit(todo: Ionz<Todo>) {
      if ($editedTodo) {
         $$: $editedTodo = null
         $$: todo.title = todo.title.trim()
         if (!todo.title) removeTodo(todo)
      }
   }

   function removeCompleted() {
      $$: $todos = filters.active($todos)
   }

   function onHashChange() {
      const route = window.location.hash.replace(/#\/?/, '') as keyof typeof filters
      if (filters[route]) {
         $$: $view = route
      } else {
         window.location.hash = ''
         $$: $view = 'all'
      }
   }



   return component(
      <>
         {/* <button on:click={initDebugger}>debug</button> */}
         <section class="todoapp">
            <header class="header">
               <h1>Todos</h1>
               <input
                  class="new-todo"
                  autofocus
                  placeholder="What needs to be done?"
                  on:keyup={e => e.key === 'Enter' && addTodo(e as unknown as InputEvent)}
               />
            </header>
            <section class="main">
               <input
                  id="toggle-all"
                  class="toggle-all"
                  type="checkbox"
                  checked={($remaining === 0)}
                  on:change={toggleAll}
               />
               <label for="toggle-all">Mark all as complete</label>
               <ul class="todo-list">
                  {For($filteredTodos, (todo) => {
                     let $isEditing = (todo === $editedTodo);

                     <li class={["todo", { completed: (todo.completed), editing: $isEditing }]}>
                        <div class="view">
                           <input class="toggle" type="checkbox" mu:checked={(todo.completed)} />
                           <label on:dblclick={e => editTodo(todo)}>{(todo.title)}</label>
                           <button class="destroy" on:click={e => removeTodo(todo)}></button>
                        </div>
                        {If(($isEditing),
                           <input
                              class="edit"
                              type="text"
                              mu:value={(todo.title)}
                              at:mounted={node => node.focus()}
                              on:blur={e => doneEdit(todo)}
                              on:keyup={e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo)}
                           />
                        )}
                     </li>
                  })}
               </ul>
            </section >
            <footer show-if={($todos.length)} class="footer">
               <span class="todo-count">
                  <strong>{($remaining)}</strong>
                  <span>{($remaining === 1 ? ' item' : ' items')} left</span>
               </span>

               <ul class="filters">
                  <li>
                     <a href="#/all" class={{ 'selected': ($view === 'all') }}>All</a>
                  </li>
                  <li>
                     <a href="#/active" class={{ 'selected': ($view === 'active') }}>Active</a>
                  </li>
                  <li>
                     <a href="#/completed" class={{ 'selected': ($view === 'completed') }}>Completed</a>
                  </li>
               </ul>

               <button class="clear-completed" on:click={removeCompleted} style={{ display: ($todos.length > $remaining ? undefined : 'none') }}>
                  Clear completed
               </button>
            </footer>
         </section>

         <o--link href="https://unpkg.com/todomvc-app-css@2.4.1/index.css" rel="stylesheet" />
      </>)
}

{/* <style>
@import "https://unpkg.com/todomvc-app-css@2.4.1/index.css";
</style> */}