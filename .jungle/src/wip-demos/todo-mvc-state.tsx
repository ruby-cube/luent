//@ts-nocheck
import { component, template, For, If, Else, FromTag, listen } from "@rue/luent"
import { watch,  trackEffect, ionize, Ionized, Ion, $, makeIon, createIon, $$, update } from "@rue/quarky"


interface Todo {
   id: number
   title: string
   completed: boolean
}

type FilterKeys = keyof typeof IonicTodoApp['filters']

class IonicTodoApp {

   constructor(
      todos: Todo[],
   ) {
      this.todos = ionize(todos, {
         [EACH]: todo => ionize(todo, {
            __DEV__debug: {
               '@set title': () => { console.trace }
            }
         })
      }) // TODO:
      return ionize(this)
   }

   todos: Ionized<Todo[]>

   filter: FilterKeys = 'all'

   setFilter(value: string) {
      if (value in IonicTodoApp.filters) {
         this.filter = value as FilterKeys
      } else {
         this.filter = 'all'
      }
   }

   static filters = {
      all: (todos: Ionized<Todo[]>) => todos,
      active: (todos: Ionized<Todo[]>) => ionize(todos.filter(todo => !todo.completed)),
      completed: (todos: Ionized<Todo[]>) => ionize(todos.filter(todo => todo.completed))
   }

   get filteredTodos() {
      return IonicTodoApp.filters[this.filter](this.todos)
   }

   get remaining() {
      return IonicTodoApp.filters.active(this.todos).length
   }

   addTodo(title: string) {
      this.todos.push({
         id: Date.now(),
         title,
         completed: false
      })
   }

   removeTodo(todo: Todo) {
      this.todos = ionize(this.todos.filter(item => item !== todo))
   }

   updateTodo(todo: Todo, title: string) {
      todo.title = title;
   }

   removeCompleted() {
      this.todos = IonicTodoApp.filters.active(this.todos)
   }

   toggleAll(completed: boolean) {
      this.todos.forEach((todo) => (todo.completed = completed))
   }
}


function TodoStorageKit() {

   const STORAGE_KEY = 'vue-todomvc'

   function getTodos() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)!) || []
   }

   function storeTodos(todos: Todo[]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
   }

   return { getTodos, storeTodos }
}


export function TodoMVC() {

   // # init and persist state
   const { getTodos, storeTodos } = TodoStorageKit()

   const app = new IonicTodoApp(getTodos())

   const { $filteredTodos, removeTodo } = $from(app)

   const { updateTodo } = IonicTodoApp

   trackEffect(() => {
      storeTodos(app.todos)
   })

   // # handle routing
   window.addEventListener('hashchange', onHashChange)
   onHashChange()

   function onHashChange() {
      const route = window.location.hash.replace(/#\/?/, '')
      app.setFilter(route) ?? (window.location.hash = '')
   }

   return (

      <>
         <section class="todoapp">
            <header class="header">
               <h1>Class: Todos</h1>
               <TodoInput can:addTodo={(app.addTodo)}></TodoInput>
            </header>
            <section class="main">
               <CheckBox can:toggleAll={(app.toggleAll)} ctx={app}></CheckBox>
               {TodoList($filteredTodos, removeTodo, updateTodo)}
            </section>
            <footer display-if={(app.todos.length)} class="footer">
               <Remaining count={(app.remaining)}></Remaining>
               <ul class="filters">
                  <li>
                     <a href="#/all" class={{ 'selected': (app.filter === 'all') }}>All</a>
                  </li>
                  <li>
                     <a href="#/active" class={{ 'selected': (app.filter === 'active') }}>Active</a>
                  </li>
                  <li>
                     <a href="#/completed" class={{ 'selected': (app.filter === 'completed') }}>Completed</a>
                  </li>
               </ul>
               <button display-if={(app.todos.length > app.remaining)} class="clear-completed" on:click={(app.removeCompleted)}>
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

type InputEvent = { target: { value: string }, key: string }
type RadioInputEvent = { target: { checked: boolean } }


function TodoInput(input: {
   'can:addTodo': (title: string) => void
}) {
   const { addTodo } = input

   function submitTodo(e: InputEvent) {
      const value = e.target.value.trim()
      if (value) {
         addTodo(value)
         e.target.value = ''
      }
   }

   return (

      <input
         class="new-todo"
         autofocus
         placeholder="What needs to be done?"
         on:keyup={e => e.key === 'Enter' && submitTodo(e as unknown as InputEvent)}
      />
   )
}



function TodoList(input: {
   todos: Ion<Ionized<Todo[]>>,
   'can:removeTodo': (todo: Ionized<Todo>) => void,
   'can:updateTodo': typeof IonicTodoApp['updateTodo']
}) {
   const { $todos, removeTodo, updateTodo } = input;

   const $editedTodo = ion(null as Todo | null)

   let titleCache = ''

   function editTodo(todo: Todo) {
      titleCache = todo.title
      $editedTodo.value = todo
   }

   function cancelEdit(todo: Todo) {
      $editedTodo.value = null
      updateTodo(todo, titleCache)
   }

   function doneEdit(todo: Ionized<Todo>) {
      if ($editedTodo()) {
         $editedTodo.value = null
         updateTodo(todo, todo.title.trim())
         if (!todo.title) removeTodo(todo)
      }
   }

   return (

      <ul class="todo-list">
         {For($todos, o => o.id, (todo) => {
            const $isEditing = ion(() => todo === $editedTodo());

            return (
               <li class={{ todo: true, completed: (todo.completed), editing: $isEditing }}>
                  <div class="view">
                     <input class="toggle" type="checkbox" mu:checked={$(todo).completed} />
                     <label on:dblclick={e => editTodo(todo)}>{(todo.title)}</label>
                     <button class="destroy" on:click={e => removeTodo(todo)}></button>
                  </div>
                  {If($isEditing,
                     <input
                        class="edit"
                        type="text"
                        mu:value={$(todo).title}
                        at:attach={node => node.focus()}
                        on:blur={e => doneEdit(todo)}
                        on:keyup={e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo)}
                     ></input>
                  )}
                  {/* {If($isEditing,
                     <input
                        class="edit"
                        type="text"
                        mu:value={$(todo).title}
                        at:attach={node => node.focus()}
                        on={[
                           blur(e => doneEdit(todo)),
                           keyup(e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo))
                        ]}
                     ></input>
                  )} */}
               </li>
            )
         })}
      </ul>
   )
}

type Ctx<T> = T // TODO: this should allow ionized object to be destructured, toIons

function CheckBox(input: {
   'can:toggleAll': IonicTodoApp['toggleAll']
   ctx: Ctx<{ remaining: IonicTodoApp['remaining'] }>
}) {
   const { toggleAll, ctx: { $remaining } } = input

   return (

      <>
         <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            checked={($remaining() === 0)}
            on:change={e => toggleAll(e.target.checked)}
         />
         <label for="toggle-all">Mark all as complete</label>
      </>
   )
}

function Remaining(input: {
   count: Ion<number>
}) {
   const { $count } = input

   return (

      <span class="todo-count">
         <strong>{$count}</strong>
         <span>{($count() === 1 ? ' item' : ' items')} left</span>
      </span>
   )
}