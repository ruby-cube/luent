//@ts-nocheck
import { component, For, If, Else } from "@rue/lumo"
import { watch, ion, queueIonicTask, ionize, Ionized, ionic } from "@rue/quarky"
import { PRERENDER } from "../../../../packages/quarky/src/reactivity/EffectCycle"

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
   let todos: Ionized<Inert<Todo>[]> = ion.ionize([], { mark: { [EACH]: inert } })
   let view: keyof typeof filters = ion('all')
   let editedTodo: Todo | null = ion(null)

   // derived state
   const $filteredTodos = ion(() => filters[view.value](todos.value))

   const remaining = ion(() => filters.active(todos.value).length)

   // handle routing
   window.addEventListener('hashchange', onHashChange)
   onHashChange()

   // persist state
   queueIonicTask(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos.value))
   })

   function toggleAll(e: RadioInputEvent) {
      todos.value.forEach(todo => { todo.completed = e.target.checked })
   }

   function addTodo(e: InputEvent) {
      const value = e.target.value.trim()
      if (value) {
         todos.value.push({
            id: Date.now(),
            title: value,
            completed: false
         })
         e.target.value = ''
      }
   }

   function removeTodo(todo: Ionized<Todo>) {
      const index = todos.value.indexOf(todo)
      todos.value.splice(index, 1)
   }

   let beforeEditCache = ''
   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      editedTodo.value = todo
   }

   function cancelEdit(todo: Ionized<Todo>) {
      editedTodo.value = null
      todo.title = beforeEditCache
   }

   function doneEdit(todo: Ionized<Todo>) {
      if (editedTodo.value) {
         editedTodo.value = null
         todo.title = todo.title.trim()
         if (!todo.title) removeTodo(todo)
      }
   }

   function removeCompleted() {
      todos.value.value = filters.active(todos.value)
   }

   function onHashChange() {
      const route = window.location.hash.replace(/#\/?/, '') as keyof typeof filters
      if (filters[route]) {
         view.value = route
      } else {
         window.location.hash = ''
         view.value = 'all'
      }
   }

   return component(
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
                  checked={(remaining.value === 0)}
                  on:change={toggleAll}
               />
               <label for="toggle-all">Mark all as complete</label>
               <ul class="todo-list">
                  {For(filteredTodos.value, (todo) => {
                     let isEditing = (todo === editedTodo.value);

                     <li class={["todo", { completed: (todo.completed), editing: isEditing }]}>
                        <div class="view">
                           <input class="toggle" type="checkbox" mu:checked={(todo.completed)} />
                           <label on:dblclick={e => editTodo(todo)}>{(todo.title)}</label>
                           <button class="destroy" on:click={e => removeTodo(todo)}></button>
                        </div>
                        {If(isEditing,
                           <input
                              class="edit"
                              type="text"
                              mu:value={todo.title}
                              at:mounted={node => node.focus()}
                              on:blur={e => doneEdit(todo)}
                              on:keyup={e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo)}
                           />
                        )}
                     </li>
                  })}
               </ul>
            </section >
            <footer show:if={todos.value.length} class="footer">
               <span class="todo-count">
                  <strong>{remaining}</strong>
                  <span>{(remaining.value === 1 ? ' item' : ' items')} left</span>
               </span>

               <ul class="filters">
                  <li>
                     <a href="#/all" class={{ 'selected': (view.value === 'all') }}>All</a>
                  </li>
                  <li>
                     <a href="#/active" class={{ 'selected': (view.value === 'active') }}>Active</a>
                  </li>
                  <li>
                     <a href="#/completed" class={{ 'selected': (view.value === 'completed') }}>Completed</a>
                  </li>
               </ul>

               <button class="clear-completed" on:click={removeCompleted} style={{ display: (todos.value.length > remaining.value ? undefined : 'none') }}>
                  Clear completed
               </button>
            </footer>
         </section>

         <o--link href="https://unpkg.com/todomvc-app-css@2.4.1/index.css" rel="stylesheet" />
      </>
   )
}

{/* <style>
@import "https://unpkg.com/todomvc-app-css@2.4.1/index.css";
</style> */}