//@ts-nocheck
import { component, template, For, If, Else } from "luent"
import { watch, ion, ionicTickTask, ionize, Ionized, ionic } from "@luent/quarky"
import { PRELUDE } from "../../../../packages/quarky/src/reactivity/x_RenderCycle"

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
      all: (todos: Todo[]) => todos,
      active: (todos: Todo[]) => todos.filter(todo => !todo.completed),
      completed: (todos: Todo[]) => todos.filter(todo => todo.completed)
   }

   // get state
   let $todos: Ionized<Inert<Todo>[]> = ion.ionize([], { mark: { [EACH]: inert } })
   let $view: keyof typeof filters = ion('all')
   let $editedTodo: Todo | null = ion(null)

   // derived state
   const $filteredTodos = ion(() => filters[$view()]($todos()))

   const $remaining = ion(() => filters.active($todos()).length)

   // handle routing
   window.addEventListener('hashchange', onHashChange)
   onHashChange()

   // persist state
   ionicTickTask(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify($todos()))
   })

   function toggleAll(e: RadioInputEvent) {
      $todos().forEach(todo => { todo.completed = e.target.checked })
   }

   function addTodo(e: InputEvent) {
      const value = e.target.value.trim()
      if (value) {
         $todos().push({
            id: Date.now(),
            title: value,
            completed: false
         })
         e.target.value = ''
      }
   }

   function removeTodo(todo: Ionized<Todo>) {
      const index = $todos.indexOf(todo)
      $todos.splice(index, 1)
   }

   let beforeEditCache = ''
   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      $editedTodo.value = todo
   }

   function cancelEdit(todo: Ionized<Todo>) {
      $editedTodo.value = null
      todo.title = beforeEditCache
   }

   function doneEdit(todo: Ionized<Todo>) {
      if ($editedTodo()) {
         $editedTodo.value = null
         todo.title = todo.title.trim()
         if (!todo.title) removeTodo(todo)
      }
   }

   function removeCompleted() {
      $todos.value = filters.active($todos())
   }

   function onHashChange() {
      const route = window.location.hash.replace(/#\/?/, '') as keyof typeof filters
      if (filters[route]) {
         $view.value = route
      } else {
         window.location.hash = ''
         $view.value = 'all'
      }
   }

   return (

      <>
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
                  checked={($remaining() === 0)}
                  on:change={toggleAll}
               />
               <label for="toggle-all">Mark all as complete</label>
               <ul class="todo-list">
                  {For(($filteredTodos), (todo) => {
                     let $isEditing = (todo === $editedTodo());

                     <li class={["todo", { completed: todo.$completed, editing: $isEditing }]}>
                        <div class="view">
                           <input class="toggle" type="checkbox" mu:checked={todo.$completed} />
                           <label on:dblclick={e => editTodo(todo)}>{(todo.title)}</label>
                           <button class="destroy" on:click={e => removeTodo(todo)}></button>
                        </div>
                        {If($isEditing,
                           <input
                              class="edit"
                              type="text"
                              mu:value={todo.title}
                              at:attach={node => node.focus()}
                              on:blur={e => doneEdit(todo)}
                              on:keyup={e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo)}
                           />
                        )}
                     </li>
                  })}
               </ul>
            </section >
            <footer display-if={$todos.length} class="footer">
               <span class="todo-count">
                  <strong>{$remaining}</strong>
                  <span>{($remaining() === 1 ? ' item' : ' items')} left</span>
               </span>

               <ul class="filters">
                  <li>
                     <a href="#/all" class={{ 'selected': ($view() === 'all') }}>All</a>
                  </li>
                  <li>
                     <a href="#/active" class={{ 'selected': ($view() === 'active') }}>Active</a>
                  </li>
                  <li>
                     <a href="#/completed" class={{ 'selected': ($view() === 'completed') }}>Completed</a>
                  </li>
               </ul>

               <button class="clear-completed" on:click={removeCompleted} style={{ display: ($todos().length > $remaining() ? undefined : 'none') }}>
                  Clear completed
               </button>
            </footer>
         </section>

         <o-link href="https://unpkg.com/todomvc-app-css@2.4.1/index.css" rel="stylesheet" />
      </>
   )
}

{/* <style>
@import "https://unpkg.com/todomvc-app-css@2.4.1/index.css";
</style> */}