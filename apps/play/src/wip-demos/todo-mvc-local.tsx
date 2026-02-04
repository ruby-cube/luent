//@ts-nocheck
import { component, For, If, Else, FromTag, fromApp, ContextKey } from "@rue/lumo"
import { watch, queueIonicTask, ionize, Ionized, Ion, $, makeIon, createIon, $$, update, EACH } from "@rue/quarky"
import { PRELUDE } from "../../../../packages/quarky/src/reactivity/RenderCycle"
import { create } from "domain"
import { inTrackedScope } from "../../../../packages/quarky/src/reactivity/Compound"

// CON: You have to return a whole object
// PRO: More composable
// PRO: Easy converstion from local to external state

// RULES OF COMPONENTS VS RENDER FUNCTION:
// - Component if you need slot, ref, events, styles
function defineDeepIonize(args: any) {
   return ionize
}


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

// [X] Can we write kits without rewriting objects? ... no :(
// [X] How to pass DBKit 
// TODO: Ionizing with options





export function TodoDBKit() {
   const STORAGE_KEY = 'vue-todomvc'

   function getTodos(): Todo[] {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)!) || []
   }

   function storeTodos(todos: Todo[]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
   }
   return {
      getTodos,
      storeTodos
   }
}


export const TODO_DB_KIT = ContextKey<{
   getTodos: () => Todo[];
   storeTodos: (todos: Todo[]) => void;
}>('todoDBKit')



const ionizeTodos = defineDeepIonize(() => ({
   nested: {
      [EACH]: ionizeTodo
   }
}))

const ionizeTodo = defineDeepIonize(() =>({
   debug: {
      '@set': {
         title: () => console.trace('set title!')
      }
   }
}))


export function TodoMVC() {
   const { getTodos, storeTodos } = fromApp(TODO_DB_KIT)

   // # state

   const $todos = Ion(ionizeTodos(getTodos()))
   const $view = Ion('all' as keyof typeof filters)

   const $filteredTodos = Ion(() => filters[$view()]($todos()))
   const $remaining = Ion(() => filters.active($todos()).length)
   const $todoCount = Ion(() => $todos().length)

   const filters = {
      all: (todos: Ionized<Todo[]>) => todos,
      active: (todos: Ionized<Todo[]>) => ionizeTodos(todos.filter(todo => !todo.completed)),
      completed: (todos: Ionized<Todo[]>) => ionizeTodos(todos.filter(todo => todo.completed))
   }

   function addTodo(title: string) {
      $todos().push(ionizeTodo({
         id: Date.now(),
         title,
         completed: false
      }))
   }

   function removeTodo(todo: Ionized<Todo>) {
      $todos().splice($todos().indexOf(todo), 1)
   }

   function removeCompleted() {
      $todos.value = filters.active($todos())
   }

   function toggleAll(checked: boolean) {
      $todos().forEach((todo) => (todo.completed = checked))
   }


   // # routing

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


   // # persist state

   queueIonicTask(() => {
      storeTodos($todos())
   })


   return component(
      <>
         <section class="todoapp">
            <header class="header">
               <h1>Todos</h1>
               {TodoInput(addTodo)}
            </header>
            <section class="main">
               {Checkbox(toggleAll, { $remaining })}
               {TodoList($filteredTodos, removeTodo)}
            </section>
            <footer show-if={$todoCount} class="footer">
               {RemainingCount($remaining)}
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

const Checkbox = (toggleAll: (checked: boolean) => void, ctx: { $remaining: Ion<number> }) => (
   <>
      <input
         id="toggle-all"
         class="toggle-all"
         type="checkbox"
         checked={(ctx.$remaining() === 0)}
         on:change={e => toggleAll(e.target.checked)}
      />
      <label for="toggle-all">Mark all as complete</label>
   </>
)


// # remaining todos

const RemainingCount = ($remaining: Ion<number>) => (
   <span class="todo-count">
      <strong>{$remaining}</strong>
      <span>{($remaining() === 1 ? ' item' : ' items')} left</span>
   </span>
)



function TodoInput(addTodo: (title: string) => void) {

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



function TodoList($todos: Ion<Ionized<Todo[]>>, removeTodo: (todo: Ionized<Todo>) => void) {

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

   return (
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


