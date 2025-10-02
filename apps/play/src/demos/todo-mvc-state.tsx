//@ts-nocheck
import { component, For, If, Else, FromTag, listen } from "@rue/lumo"
import { watch, ion, initIonicTask, ionize, Ionized, Ion, $, makeIon, createIon, $$ } from "@rue/quarky"
import { PRERENDER } from "../../../../packages/lumo/src/render-cycle"
import { create } from "domain"
import { isTracking } from "../../../../packages/quarky/src/compound/Compound"

// entity.name.type.tsx
// meta.type.annotation.tsx
// meta.parameters.tsx
// meta.arrow.tsx
// meta.object.member.tsx
// meta.objectliteral.tsx



// variable.other.object.tsx
// meta.function-call.tsx

// entity.name.function.tsx
// meta.function-call.tsx

// foreground	
// entity.name.function

interface Todo {
   id: number
   title: string
   completed: boolean
}

type InputEvent = { target: { value: string }, key: string }
type RadioInputEvent = { target: { checked: boolean } }

//TODO:
// const frog = Ionized({
//    name: absorb($name),
//    canvas: inert(null)
// })

// const CountIon = defineIon({
//    increment() {
//       this.value++
//    },
//    decrement() {
//       this.value--
//    }
// }, { value: 0 })

// const increment_decrement = asIonMethods({
//    increment() {
//       this.value++
//    },
//    decrement() {
//       this.value--
//    }
// })
// const divStyle = jsx({

// })

// export function CounterA() {

//    const $count = Ion(0, {
//       increment() {
//          this.value++
//       },
//       decrement() {
//          this.value--
//       }
//    })

//    return component(
//       <>
//          <div>{$count}</div>
//          <button on:click={e => $count.increment()}>increment</button>
//          <button on:click={e => $count.decrement()}>decrement</button>
//       </>
//    )
// }

// export function CounterB() {

//    const $count = Ion(0)

//    function incrementCount() {
//       $count.value++
//    }

//    function decrementCount() {
//       $count.value--
//    }

//    return component(
//       <>
//          <div>{$count}</div>
//          <button on:click={incrementCount}>increment</button>
//          <button on:click={decrementCount}>decrement</button>
//       </>
//    )
// }
type FilterKeys = 'all' | 'active' | 'completed'


class IonizedTodoApp {

   view: FilterKeys = 'all'

   constructor(
      public todos: Todo[],
   ) {
      console.log(todos)
      return Ionized(this)
   }

   filters = {
      all: (todos: Todo[]) => todos,
      active: (todos: Todo[]) => todos.filter(todo => !todo.completed),
      completed: (todos: Todo[]) => todos.filter(todo => todo.completed)
   }

   get filteredTodos() {
      return this.filters[this.view](this.todos)
   }

   get remaining() {
      return this.filters.active(this.todos).length
   }

   addTodo(title: string) {
      const item = Ionized({
         id: Date.now(),
         title,
         completed: false
      })

      this.todos.push(item)

      // const lastItem = this.todos.pop()

      // this.todos.push(lastItem) // FIX: should update list rendering

      // console.log('IDENTITY?', item === lastItem) //FIX: Identity hazard
   }

   removeTodo(todo: Todo) {
      const index = this.todos.indexOf(todo)
      this.todos.splice(index, 1)
   }

   removeCompleted() {
      this.todos = this.filters.active(this.todos)
   }

   toggleAll(completed: boolean) {
      this.todos.forEach((todo) => (todo.completed = completed))
   }
}


class TodoApp {

   view: FilterKeys = 'all'

   constructor(
      public todos: Todo[],
   ) {
      console.log(todos)
   }

   filters = {
      all: (todos: Todo[]) => todos,
      active: (todos: Todo[]) => todos.filter(todo => !todo.completed),
      completed: (todos: Todo[]) => todos.filter(todo => todo.completed)
   }

   get filteredTodos() {
      return this.filters[this.view](this.todos)
   }

   get remaining() {
      return this.filters.active(this.todos).length
   }

   addTodo(title: string) {
      this.todos.push({
         id: Date.now(),
         title,
         completed: false
      })

      // const lastItem = this.todos.pop()

      // this.todos.push(lastItem) // FIX: should update list rendering

      // console.log('IDENTITY?', item === lastItem) //FIX: Identity hazard
   }

   removeTodo(index: number) {
      this.todos.splice(index, 1)
   }

   removeCompleted() {
      this.todos = this.filters.active(this.todos)
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

   const app = new IonizedTodoApp(getTodos())
   app.todos
   app.view
   app.filters
   app.filteredTodos

   console.log('filtered todos', $(app).filteredTodos)

   initIonicTask(() => {
      storeTodos(app.todos)
   })


   // # handle routing
   listen(window, 'hashchange', onHashChange)
   onHashChange()

   function onHashChange() {
      const route = window.location.hash.replace(/#\/?/, '') as FilterKeys
      if (app.filters[route]) {
         app.view = route
      } else {
         window.location.hash = ''
         app.view = 'all'
      }
   }


   return component(
      <>
         <section class="todoapp">
            <header class="header">
               <h1>Class: Todos</h1>
               <TodoInput can:addTodo={app.addTodo.bind(app)}></TodoInput>
            </header>
            <section class="main">
               <ToggleAll can:toggleAll={app.toggleAll.bind(app)} ctx={app}></ToggleAll>
               <TodoList todos={(app.filteredTodos)} can:removeTodo={app.removeTodo.bind(app)}></TodoList>
            </section>
            <footer show-if={(app.todos.length)} class="footer">
               <Remaining count={(app.remaining)}></Remaining>
               <ul class="filters">
                  <li>
                     <a href="#/all" class={{ 'selected': (app.view === 'all') }}>All</a>
                  </li>
                  <li>
                     <a href="#/active" class={{ 'selected': (app.view === 'active') }}>Active</a>
                  </li>
                  <li>
                     <a href="#/completed" class={{ 'selected': (app.view === 'completed') }}>Completed</a>
                  </li>
               </ul>
               <button show-if={(app.todos.length > app.remaining)} class="clear-completed" on:click={app.removeCompleted.bind(app)}>
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



function TodoInput({ addTodo }: FromTag<{ 'can:addTodo': (title: string) => void }>) {

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



function TodoList({ $todos, removeTodo }: FromTag<{
   todos: Ion<Ionized<Todo[]>>,
   'can:removeTodo': (todo: Ionized<Todo>) => void
}>) {

   const $editedTodo = Ion(null as Todo | null)

   let beforeEditCache = ''

   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      $editedTodo.value = todo
   }

   function cancelEdit(todo: Todo) {
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

   return component(
      <ul class="todo-list">
         {For($todos, o => o.id, (todo, $index) => {
            const $isEditing = Ion(() => todo === $editedTodo());

            return (
               <li class={["todo", { completed: (todo.completed), editing: $isEditing }]}>
                  <div class="view">
                     <input class="toggle" type="checkbox" mu:checked={$(todo).completed} />
                     <label on:dblclick={e => editTodo(todo)}>{(todo.title)}</label>
                     <button class="destroy" on:click={e => removeTodo($index())}></button>
                  </div>
                  {If($isEditing,
                     <input
                        class="edit"
                        type="text"
                        mu:value={$(todo).title}
                        at:mounted={node => node.focus()}
                        on:blur={e => doneEdit(todo)}
                        on:keyup={e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo)}
                     />
                  )}
               </li>
            )
         })}
      </ul>
   )
}


function ToggleAll({ toggleAll, ctx }: FromTag<{
   'can:toggleAll': TodoApp['toggleAll']
   ctx: Ionized<{ remaining: TodoApp['remaining'] }>
}>) {

   return component(
      <>
         <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            checked={(ctx.remaining === 0)}
            on:change={e => toggleAll(e.target.checked)}
         />
         <label for="toggle-all">Mark all as complete</label>
      </>
   )
}

function Remaining({ $count }: FromTag<{ count: Ion<number> }>) {

   return component(
      <span class="todo-count">
         <strong>{$count}</strong>
         <span>{($count() === 1 ? ' item' : ' items')} left</span>
      </span>
   )
}