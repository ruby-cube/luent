//@ts-nocheck
import { component, template, For, If, Else, FromTag, fromRoot, ContextKey, ContextEntryKey, fromGround } from "@rue/luent"
import { watch,  queueIonicTask, ionize, Ionized, Ion, makeIon, createIon, $$, update, EACH, defineDeepIonize, MutableIon, defineIon } from "@rue/quarky"
import { PRELUDE } from "../../../../packages/quarky/src/reactivity/x_RenderCycle"
import { create } from "domain"
import { inTrackedScope } from "../../../../packages/quarky/src/reactivity/Compound"
import { TODO_DB_KIT } from "./todo-mvc-local"
import { AnyObject } from "@rue/types"

// CON: You have to return a whole object
// PRO: More composable
// PRO: Easy converstion from local to external state

// RULES OF COMPONENTS VS RENDER FUNCTION:
// - Component if you need slot, ref, events, styles, mu:

type IonizeOptions = {
   nested?: any,
   '@set'?: { [key: string]: () => void },
   '@get'?: { [key: string]: () => void },
}


type $<T> = Ion<T>

type $$<T extends object> = Ionized<T>

type $$$<T extends object> = Ion<Ionized<T>>


// interface Todo {
//    id: number
//    title: string
//    completed: boolean
// }

// # procedures for interface




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

// [X] Can we write kits without rewriting objects? ... no :(
// [X] How to pass DBKit 
// [X] Ionizing with options

function can<T>(fn: T): T {
   return fn
}

// class Todo {
//    constructor(
//       public readonly id: number,
//       public title: string,
//       public completed: boolean
//    ) {

//    }
// }
interface Todo {
   readonly id: number,
   title: string,
   completed: boolean
}


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


export const TODO_DB = ContextKey<TodoDB>('todoDB')

type $$TodoArray = ReturnType<typeof ionizeTodos>

const ionizeTodos = defineDeepIonize((type: Todo[]) => ({
   nested: [ionizeTodo],
}))

type $$Todo = ReturnType<typeof ionizeTodo>

const ionizeTodo = defineDeepIonize((type: Todo) => ({
   // fromData: (todo: Todo) => new Todo(todo.id, todo.title, todo.completed),
   '@set': {
      title: () => console.trace('set title!')
   }
}))


//QUESTION: while create an ionizedTodos function instead of a $TodoArray function?

function IonizedTodoArray(todos: Todo[]) {
   return ionize(todos, {
      nested: [IonizedTodo]
   })
}

function IonizedTodo(todo: Todo) {
   return ionize(todo, {
      '@set': {
         title: () => console.trace('set title!')
      }
   })
}

const somthing = ion(0, { addOne() { } })

const TodosIon = defineIon((todos: Todo[]) => IonizedTodoArray(todos), {

   addTodo(todo: $$Todo) {
      this.value.push(todo)
   },

   removeTodo(todo: $$Todo) {
      this.value.splice(this.value.indexOf(todo), 1)
   },

   toggleAllComplete(completed: boolean) {
      this.value.forEach((todo) => (todo.completed = completed))
   },

   isAllComplete() {

   },

   '~pure'() {
      return ['isAllComplete']
   }
})




type TodoAppKit = typeof TodoAppKit

function TodoAppKit(todos: Todo[]) {

   const $todos = TodosIon(todos)
   const $view = ion('all' as keyof typeof filters)

   const $filteredTodos = ion(() => filters[$view()]($todos()))
   const $remaining = ion(() => filters.active($todos()).length)
   const $todoCount = ion(() => $todos().length)

   const filters = {
      all: (todos: $$TodoArray) => todos,
      active: (todos: $$TodoArray) => ionize(todos.filter(todo => !todo.completed)),
      completed: (todos: $$TodoArray) => ionize(todos.filter(todo => todo.completed))
   }

   function createTodo(title: string) {
      return ionizeTodo({
         id: Date.now(),
         title,
         completed: false
      })
   }

   // function addTodo(todo: Ionized<Todo>) {
   //    $todos().push(todo)
   // }

   // function removeTodo(todo: Ionized<Todo>) {
   //    $todos().splice($todos().indexOf(todo), 1)
   // }

   function removeCompleted() {
      $todos.value = filters.active($todos())
   }

   // function toggleAll(checked: boolean) {
   //    $todos().forEach((todo) => (todo.completed = checked))
   // }

   return {
      $todos,
      $view,
      $filteredTodos,
      $remaining,
      $todoCount,
      filters,
      removeCompleted,
      createTodo
   }
}

type FromAbove<T> = T extends ContextEntryKey<infer I> ? I : never


// TODO: fromGround (checks appwide first then global) only (no fromRoot), provideGround, and provideRoot

const USE_TODO_APP = ContextKey<typeof TodoAppKit>('useTodoApp')

type TodoDB = ReturnType<typeof TodoDBKit>

// type TodoMVCInput = FromTag<{
//    db?: TodoDB,
//    useTodoApp?: TodoAppKit
// }>

export function TodoMVC({
   db: { getTodos, storeTodos } = TodoDBKit(),
   useTodoApp = TodoAppKit
}) {

   // # state
   const {
      $todos,
      $view,
      filters,
      $filteredTodos,
      $remaining,
      $todoCount,
      removeCompleted,
      createTodo
   } = useTodoApp(getTodos())


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
               {TodoInput(
                  can(($todos.addTodo)),
                  can(createTodo)
               )}
            </header>
            <section class="main">
               {Checkbox(
                  can(($todos.toggleAllComplete)),
                  { $remaining }
               )}
               <TodoList
                  mu:todos={$filteredTodos}
                  removeTodo={($todos.removeTodo)}
               ></TodoList>
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

         <o-link href="https://unpkg.com/todomvc-app-css@2.4.1/index.css" rel="stylesheet" />
      </>)
}

{/* <style>
@import "https://unpkg.com/todomvc-app-css@2.4.1/index.css";
</style> */}

const Checkbox = (toggleAll: (checked: boolean) => void, ctx: { $remaining: $<number> }) => (
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

const RemainingCount = ($remaining: $<number>) => (
   <span class="todo-count">
      <strong>{$remaining}</strong>
      <span>{($remaining() === 1 ? ' item' : ' items')} left</span>
   </span>
)




function TodoInput(addTodo: (todo: $$<Todo>) => void, createTodo: (title: string) => $$Todo) {

   function submitTodo(e: InputEvent) {
      const value = e.target.value.trim()
      if (value) {
         addTodo(createTodo(value))
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

type IsMutable<T> = (value: T) => value is Mutable<T>
type Mutable<T> = T


function TodoList(input: FromTag<{
   'mu:todos': Ion<$$TodoArray>,
   removeTodo: (todo: Ionic<Todo>) => void,
}>) {
   const { mu, $todos, removeTodo, } = input()

   const $editedTodo = ion(null as Todo | null)

   let beforeEditCache = ''

   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      mu($editedTodo).value = todo
   }

   function cancelEdit(todo: $$<Todo>) {
      mu($editedTodo).value = null
      mu(todo).title = beforeEditCache
   }

   function doneEdit(todo: Mu<$$Todo>) { //NOTE: Typescript is not a fullproof solution to preventing mutations. When you do something like this, you give the power to mutate again...
      if ($editedTodo()) {
         mu($editedTodo).value = null
         mu(todo).title = todo.title.trim() //FIX: But how would you implement this? How do you know todo is mutable when it's nested in filtered todos?
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
                     <input class="toggle" type="checkbox" mu:checked={$from(todo).$completed} />
                     <label on:dblclick={e => editTodo(todo)}>{(todo.title)}</label>
                     <button class="destroy" on:click={e => removeTodo(todo)}></button>
                  </div>
                  {If($isEditing,
                     <input
                        class="edit"
                        type="text"
                        mu:value={$from(todo).$title}
                        at:mount={node => node.focus()}
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


function mutateTodo(todo: Todo) {

}

mutateTodo(null as unknown as Readonly<Todo>)

function readTodo(todo: Readonly<Todo>) {

}

readTodo(null as unknown as Todo)