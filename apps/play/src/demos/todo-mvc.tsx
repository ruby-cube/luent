import { component, For, If, Else, FromTag } from "@rue/lumo"
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


export function TodoMVC() {

   const $todos = Ion.Ionized(getTodos())
   const $view = Ion('all' as keyof typeof filters)

   const $filteredTodos = Ion(() => filters[$view()]($todos()))
   const $remaining = Ion(() => filters.active($todos()).length)
   const $todoCount = Ion(() => $todos().length)

   const filters = {
      all: (todos: Ionized<Todo[]>) => todos,
      active: (todos: Ionized<Todo[]>) => Ionized(todos.filter(todo => !todo.completed)),
      completed: (todos: Ionized<Todo[]>) => Ionized(todos.filter(todo => todo.completed))
   }


   // persist state
   function getTodos(): Todo[] {
      const STORAGE_KEY = 'vue-todomvc'

      initIonicTask(() => {
         localStorage.setItem(STORAGE_KEY, JSON.stringify($todos()))
      })

      return JSON.parse(localStorage.getItem(STORAGE_KEY)!) || []
   }




   // todos methods

   function addTodo(title: string) {
      $todos().push(Ionized({
         id: Date.now(),
         title,
         completed: false
      }))
   }

   function removeTodo(todo: Ionized<Todo>) {
      const index = $todos().indexOf(todo)
      $todos().splice(index, 1)
   }

   function removeCompleted() {
      $todos.value = filters.active($todos())
   }

   function toggleAll(e: RadioInputEvent) {
      $todos().forEach((todo) => (todo.completed = e.target.checked))
   }



   // handle routing
   window.addEventListener('hashchange', onHashChange)
   onHashChange()

   function onHashChange() {
      const route = window.location.hash.replace(/#\/?/, '') as FilterKeys
      if (filters[route]) {
         $view.value = route
      } else {
         window.location.hash = ''
         $view.value = 'all'
      }
   }

   return component(
      <>
         <section class="todoapp">
            <header class="header">
               <h1>Todos</h1>
               <TodoInput can:addTodo={addTodo}></TodoInput>
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
               <TodoList todos={$filteredTodos} can:removeTodo={removeTodo}></TodoList>
            </section>
            <footer show-if={$todoCount} class="footer">
               <FilterBar
                  view={$view}
                  todoCount={$todoCount}
                  remainingCount={$remaining}
                  can:removeCompleted={removeCompleted}
               ></FilterBar>
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


type TodoListInput = FromTag<{
   todos: Ion<Ionized<Todo[]>>,
   'can:removeTodo': (todo: Ionized<Todo>) => void
}>

function TodoList({ $todos, removeTodo }: TodoListInput) {

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
         {For($todos, o => o.id, (todo) => {
            const $isEditing = Ion(() => todo === $editedTodo());

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

type FilterKeys = 'all' | 'active' | 'completed'

type FilterBarInput = FromTag<{
   view: Ion<FilterKeys>
   remainingCount: Ion<number>
   todoCount: Ion<number>
   'can:removeCompleted': () => void
}>

function FilterBar({
   $view,
   $remainingCount,
   $todoCount,
   removeCompleted,
}: FilterBarInput) {

   return component(
      <>
         <span class="todo-count">
            <strong>{$remainingCount}</strong>
            <span>{($remainingCount() === 1 ? ' item' : ' items')} left</span>
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

         <button show-if={($todoCount() > $remainingCount())} class="clear-completed" on:click={removeCompleted}>
            Clear completed
         </button>
      </>
   )
}