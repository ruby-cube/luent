import { component, template, For, If, Else, FromTag } from "@rue/luent"
import { watch,  queueIonicTask, ionize, Ionized, Ion, $, makeIon, createIon, $$ } from "@rue/quarky"
import { PRELUDE } from "../../../../packages/quarky/src/reactivity/x_RenderCycle"
import { create } from "domain"
import { inTrackedScope } from "../../../../packages/quarky/src/reactivity/Compound"

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

// TODO:
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

//    const $count = ion(0, {
//       increment() {
//          this.value++
//       },
//       decrement() {
//          this.value--
//       }
//    })

//    return template(
//       <>
//          <div>{$count}</div>
//          <button on:click={e => $count.increment()}>increment</button>
//          <button on:click={e => $count.decrement()}>decrement</button>
//       </>
//    )
// }

// export function CounterB() {

//    const $count = ion(0)

//    function incrementCount() {
//       $count.value++
//    }

//    function decrementCount() {
//       $count.value--
//    }

//    return template(
//       <>
//          <div>{$count}</div>
//          <button on:click={incrementCount}>increment</button>
//          <button on:click={decrementCount}>decrement</button>
//       </>
//    )
// }
type FilterKeys = 'all' | 'active' | 'completed'

export function TodoMVC() {

   const app = Ionized({

      todos: getTodos(),
      view: 'all' as FilterKeys,

      filters: {
         all: (todos: Todo[]) => todos,
         active: (todos: Todo[]) => Ionized(todos.filter(todo => !todo.completed)),
         completed: (todos: Todo[]) => Ionized(todos.filter(todo => todo.completed))
      },

      get filteredTodos() {
         return this.filters[this.view](this.todos)
      },

      get remaining() {
         return this.filters.active(this.todos).length
      },

      addTodo(title: string) {
         this.todos.push({
            id: Date.now(),
            title,
            completed: false
         })
      },

      removeTodo(todo: Ionized<Todo>) {
         const index = this.todos.indexOf(todo)
         this.todos.splice(index, 1)
      },

      removeCompleted() {
         this.todos = this.filters.active(this.todos)
      },

      toggleAll(e: RadioInputEvent) {
         this.todos.forEach((todo) => (todo.completed = e.target.checked))
      }
   })


   // # handle routing

   window.addEventListener('hashchange', onHashChange)
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


   // # persist state

   function getTodos(): Todo[] {
      const STORAGE_KEY = 'vue-todomvc'

      queueIonicTask(() => {
         localStorage.setItem(STORAGE_KEY, JSON.stringify(app.todos))
      })

      return JSON.parse(localStorage.getItem(STORAGE_KEY)!) || []
   }


   // # todos methods

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


   return component(
      <>
         <section class="todoapp">
            <header class="header">
               <h1>Todos</h1>
               <TodoInput addTodo={addTodo}></TodoInput>
            </header>
            <section class="main">
               {ToggleAllButton()}
               <TodoList todos={$filteredTodos} removeTodo={removeTodo}></TodoList>
            </section>
            <footer show-if={$todoCount} class="footer">
               {RemainingCount()}
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
               <button show-if={($todoCount() > $remaining())} class="clear-completed" on:click={removeCompleted}>
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
   removeTodo: (todo: Ionized<Todo>) => void
}>) {

   const $editedTodo = ion(null as Todo | null)

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
         {For($todos, o => o.id, (todo) => {
            const $isEditing = ion(() => todo === $editedTodo());

            return (
               <li class={["todo", { completed: (todo.completed), editing: $isEditing }]}>
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


