import { component, template, For, If, Else, FromTag, listen, isMutableIon, NodeRef } from "@rue/luent"
import { watch, trackEffect, Ion, Ionic, EACH, ionic, ion } from "@rue/quarky"

interface Todo {
   id: number
   title: string
   completed: boolean
}

type InputEvent = { target: { value: string }, key: string }
type RadioInputEvent = { target: { checked: boolean } }
type FilterKeys = 'all' | 'active' | 'completed'

type IonicTodo = Ionic<Todo>

const ionicTodos = (todos: Todo[]) => ionic(todos, { [EACH]: { '-as': ionic } })

function Hi() {
   const something = ionicTodos([]);
   (
      <div></div>
      <div></div>
   )
}


export function TodoMVC() {

   const $todos = ion(ionicTodos(getTodos()))
   const $view = ion('all' as keyof typeof filters)


   const filters = {
      all: (todos: Todo[]) => todos,
      active: (todos: Todo[]) => todos.filter(todo => !todo.completed),
      completed: (todos: Todo[]) => todos.filter(todo => todo.completed)
   }

   const $filteredTodos = ion(() => ionicTodos(filters[$view()]($todos())))
   const $remaining = ion(() => filters.active($todos()).length)
   const $todoCount = ion(() => $todos().length)

   // dev.logAtoms($remaining)

   watch($todoCount, () => {
      console.log('@&@ todoCount', $todoCount())
   })
   watch($remaining, () => {
      console.log('@&@ remaining', $remaining())
   })

   // # handle routing

   listen(window, 'hashchange', () => {
      const route = window.location.hash.replace(/#\/?/, '') as FilterKeys
      if (filters[route]) {
         $view.value = route
      } else {
         window.location.hash = ''
         $view.value = 'all'
      }
   }, { eager: true })


   // # persist state

   function getTodos(): Todo[] {
      const STORAGE_KEY = 'vue-todomvc'

      trackEffect(() => {
         localStorage.setItem(STORAGE_KEY, JSON.stringify($todos()))
      })

      return JSON.parse(localStorage.getItem(STORAGE_KEY)!) || []
   }


   // # todos methods

   function addTodo(title: string) {
      $todos().push(ionic({
         id: Date.now(),
         title,
         completed: false
      }))
   }

   function removeTodo(todo: Ionic<Todo>) {
      $todos().splice($todos().indexOf(todo), 1)
   }

   function removeCompleted() {
      $todos.value = ionicTodos(filters.active($todos()))
   }


   // # toggle completed

   function toggleAll(e: RadioInputEvent) {
      $todos().forEach((todo) => { todo.completed = e.target.checked })
   }

   const ToggleAllButton = () => (
      <>
         <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            checked={($remaining() === 0)}
            on:change={toggleAll}
         />
         <label for="toggle-all">Mark all as complete</label>
      </>
   )


   // # remaining todos

   const RemainingCount = () => (
      <span class="todo-count">
         <strong>{$remaining}</strong>
         <span>{($remaining() === 1 ? ' item' : ' items')} left</span>
      </span>
   )

   const $todoList = NodeRef(TodoList)
   const $h1 = NodeRef('h1')

   return component(
      <>
         <section class="todoapp">
            <header class="header">
               <h1 ref={$h1}>Todos</h1>
               <TodoInput addTodo={addTodo}></TodoInput>
            </header>
            <section class="main">
               {ToggleAllButton()}
               <TodoList ref={$todoList} at:attach={node => node} todos={$filteredTodos} removeTodo={removeTodo}></TodoList>
            </section>
            <footer display-if={$todoCount} class="footer">
               {RemainingCount()}
               <ul class="filters">
                  <li>
                     <a href="#/all" class={($view() === 'all' && 'selected')}>All</a>
                  </li>
                  <li>
                     <a href="#/active" class={($view() === 'active' && 'selected')}>Active</a>
                  </li>
                  <li>
                     <a href="#/completed" class={($view() === 'completed' && 'selected')}>Completed</a>
                  </li>
               </ul>
               <button display-if={($todoCount() > $remaining())} class="clear-completed" on:click={removeCompleted}>
                  Clear completed
               </button>
            </footer>
         </section>

         <o-link href="https://unpkg.com/todomvc-app-css@2.4.1/index.css" rel="stylesheet" />
      </>)
}

{/* <style>
@import "https://unpkg.com/todomvc-app-css@2.4.1/index.css";
</style> */}

function TodoInput({ addTodo }: { addTodo: (title: string) => void }) {

   function submitTodo(e: InputEvent) {
      const value = e.target.value.trim()
      if (value) {
         addTodo(value)
         e.target.value = ''
      }
   }

   return component(
      <input
         class="new-todo"
         autofocus
         placeholder="What needs to be done?"
         on:keyup={e => e.key === 'Enter' && submitTodo(e as unknown as InputEvent)}
      />
   )
}



function TodoList({ $todos, removeTodo }: {
   todos: Ion<Ionic<Ionic<Todo>[]>>,
   removeTodo: (todo: Ionic<Todo>) => void
}) {

   const $editedTodo = ion(null as Todo | null)

   let beforeEditCache = ''

   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      // debugger;
      $editedTodo.value = todo
   }

   function cancelEdit(todo: Todo) {
      $editedTodo.value = null
      todo.title = beforeEditCache
   }

   function doneEdit(todo: Ionic<Todo>) {
      if ($editedTodo()) {
         $editedTodo.value = null
         todo.title = todo.title.trim()
         if (!todo.title) removeTodo(todo)
      }
   }
   watch($editedTodo, () => {
      console.log('isEditing?', $editedTodo())
   })

   return component(
      <ul class="todo-list">
         {For($todos, m => m.id, (todo) => {
            const $isEditing = ion(() => todo === $editedTodo());

            return (
               <li class={['todo', { 'completed': todo.$completed, 'editing': $isEditing }]}>
                  <div class="view">
                     <input class="toggle" type="checkbox" mu:checked={todo.$completed} />
                     <label on:dblclick={e => editTodo(todo)}>{(todo.title)}</label>
                     <button class="destroy" on:click={e => removeTodo(todo)}></button>
                  </div>
                  {If($isEditing,
                     <input
                        class="edit"
                        type="text"
                        mu:value={todo.$title}
                        at:attach={node => node.focus()}
                        on:blur={e => doneEdit(todo)}
                        on:keyup={e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo)}
                     />
                  )}
               </li>
            )
         })}
      </ul>
   )
      .ref({
         message: 'hi'
      })
}


