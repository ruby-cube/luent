//@ts-nocheck
import { component, For, If, Else, FromTag, fromApp, ContextKey, CommonsEntryKey, fromGlobal, SuspenseIon, fromRoot } from "@rue/lumo"
import { watch, ion, queueIonicTask, ionize, Ionized, Ion, makeIon, createIon, $$, update, EACH, defineDeepIonize, MutableIon, defineIon } from "@rue/quarky"
import { PRERENDER } from "../../../../packages/quarky/src/reactivity/EffectCycle"
import { create } from "domain"
import { isTracking } from "../../../../packages/quarky/src/abstract/Compound"
import { TODO_DB_KIT } from "./todo-mvc-local"
import { AnyObject } from "@rue/types"
import { json } from "stream/consumers"

// CON: You have to return a whole object
// PRO: More composable
// PRO: Easy converstion from local to external state

// RULES OF COMPONENTS VS RENDER FUNCTION:
// - Component if you need slot, ref, events, styles, mu:

type ModProp = {
   '~mod': true,
   '@get': (value: unknown) => void
   '@set': (value: unknown) => void
   get: <T>(that: H, value: T) => T
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

// const ionizeTodos = defineDeepIonize((type: Todo[]) => ({
//    nested: [ionizeTodo],
// }))

type $$Todo = ReturnType<typeof ionizeTodo>

// const ionizeTodo = defineDeepIonize((type: Todo) => ({
//    // fromData: (todo: Todo) => new Todo(todo.id, todo.title, todo.completed),
//    '@set': {
//       title: () => console.trace('set title!')
//    }
// }))


// class IonicTodoA {
//    id: string

//    constructor() {
//       const todo = this;

//       this.completed = SuspenseIon(this.completed, {
//          '@set'() {
//             await db.patchTodo(todo.id).setCompleted(todo.completed)
//          }
//       })
//    }
//    completed = SuspenseIon(this.completed, {
//       '@set'() {
//          await db.patchTodo(this.id).setCompleted(this.completed)
//       }
//    })
// }


//QUESTION: while create an ionizedTodos function instead of a $TodoArray function?

// function IonicTodoArray(todos: Todo[]) {
//    return Ionic(todos, {
//       '@setup'() {

//       },
//       nest() { return [IonicTodo] }
//    })
// }

// function IonicTodo(todo: Todo) {
//    return Ionic(todo, {
//       '@set': {
//          title: () => console.trace('set title!')
//       },
//       nest(todo) {
//          return {
//             completed: SuspenseIon(todo.completed, {
//                '@set'() {
//                   await db.patchTodo(todo.id).setCompleted(todo.completed)
//                }
//             })
//          }
//       }
//    })
// }

//TODO: How do we do DI for IonicTodo and db?? 
// We can't call fromRoot inside because they may be called in an async 'dead zone'
// - either we explicitly pass them in
// - or we ensure they are never called in a dead zone
// - or we unashamedly couple them the way we unashamedly couple components
// - or we wrap them in a kit that must be called at the top level of a component

// - I'm fine with coupling the IonicTodoArray and IonicArray, the Todo class and db still need to be passed in

function IonicTodoArray(todos: Todo[]) {
   return Ionic(todos, {
      [EACH]: { init: IonicTodo }
   })
}

IonicTodo.db = RootContextKey<TodosDatabase>()

function IonicTodo(todo: Todo) {
   const db = fromRoot(IonicTodo.db)

   return Ionic(todo, {
      title: {
         '@set'(value) { console.trace('set title!', value) },
      },
      completed: {
         suspense: true,
         initial: todo.completed,
         '@set'(value) {
            await db.patchTodo(this.id, { completed: value })
         }
      },
      author: { ionize: IonicProfile },
      article: { ionize: IonicArticle }
   })
}

// function IonicTodo(todo: Todo) {

//    return Ionic(todo, mod => ({
//       title: mod({
//          '@set'(value) { console.trace('set title!', value) },
//       }),
//       completed: mod({
//          get: SuspenseIon(todo.completed),
//          '@set'(value) {
//             this.$completed.markStale()
//             await db.patchTodo(this.id).setCompleted(value)
//             this.$completed.markFresh()
//          }
//       }),
//       author: IonicProfile,
//       article: IonicArticle
//    }))
// }



// server or client logic
class Todos {
   constructor(public value: Todo[]) {

   }

   addTodo(todo: Todo) {
      this.value.push(todo)
   }

   removeTodo(todo: Todo) {
      this.value.splice(this.value.indexOf(todo), 1)
   }

   setCompleteForEach(complete: boolean) {
      this.value.forEach((todo) => (todo.completed = completed))
   }
}


// server functions -- business logic on server: must capture intent
class TodosDB {
   async addTodo(todo: Todo) {
      app.post('/todos', { body: JSON.stringify(todo) })
   }

   async removeTodo(todo: Todo) {
      app.delete(`/todos/${todo.id}`)
   }

   async setCompleteForEach(complete: boolean) {
      app.patch('/todos', { type: 'patch' })
   }

   patchTodo(id: string) {
      return {
         async setCompleted(value: boolean, options: { debounced: number }) {
            return app.dispatch({
               action: SET_COMPLETED,
               payload: [value],
               method: 'PATCH',
               url: `/todos/todo/${id}`
            })
         }
      }
   }
}



const todosIon = SuspenseIon(undefined, {
   fetch: () => db.fetchTodos().then(todos => IonicTodoArray(todos)),
   '@init'() {

   },
   '@set'(value) {
      await db.setTodos(value)
   },
   standin: () => { }
}, {
   addTodo(todo: $$Todo) {
      this.value.push(todo) // optimistic update
   },

   removeTodo(todo: $$Todo) {
      this.value.splice(this.value.indexOf(todo), 1)
   },

   removeCompleted() {
      this.value = this.value.filter(todo => !todo.completed)
   },

   setCompleteForEach(completed: boolean) {
      this.value.forEach((todo) => (todo.completed = completed))
   },

   isAllComplete() {

   },

   '~pure'() {
      return ['isAllComplete']
   },

   '@addTodo'(todo: Todo) { // TODO: auto mark stale and unstale 
      await db.addTodo(todo)
   },

   '@removeTodo'(todo: $$Todo) {
      // this.value.splice(this.value.indexOf(todo), 1)
   },

   '@removeCompleted'() {
      // this.value = this.value.filter(todo => !todo.completed)
   },

   '@setCompleteForEach'(completed: boolean) {
      // this.value.forEach((todo) => (todo.completed = completed))
   },
})

class TodosDB {
   addTodo(todo: Todo) {
      return dispatch('/todos', { action: 'addTodo', payload: { todo: JSON.stringify(todo) } })
   }
}



// const TodosIon = defineSuspenseIon((todos: Todo[]) => IonicTodoArray(todos), {

//    addTodo(todo: $$Todo) {
//       this.value.push(todo)
//    },

//    removeTodo(todo: $$Todo) {
//       this.value.splice(this.value.indexOf(todo), 1)
//    },

//    toggleAllComplete(completed: boolean) {
//       this.value.forEach((todo) => (todo.completed = completed))
//    },

//    isAllComplete() {

//    },

//    '~pure'() {
//       return ['isAllComplete']
//    }
// })

async function doSomething() {
   await promise
      .then(res => {
         return res.json()
      })
      .then(({ a, b }) => {
         console.log('a', a)
         console.log('b', b)
      })
}

async function doSomething() {
   const { run } = snapContext()
   await fetch('/something')
   run(res => {
      return res.json()
      console.log('a', a)
      console.log('b', b)
   })
}


// const doSomething = Stream(async ({ run }) => {
//    await run(promise)
//    await run(res => {
//       const a = 'hi'
//       const b = 'bye' + res
//       return { a, b }
//    })
//    await run(({ a, b }) => {
//       console.log('a', a)
//       console.log('b', b)
//    })
// })


type TodoAppKit = typeof TodoAppKit

function TodoAppKit(todos: Todo[]) {

   const $todos = TodosIon(todos)
   const $view = Ion('all' as keyof typeof filters)

   const $filteredTodos = Ion(() => filters[$view()]($todos()))
   const $remaining = Ion(() => filters.active($todos()).length)
   const $todoCount = Ion(() => $todos().length)

   const filters = {
      all: (todos: $$TodoArray) => todos,
      active: (todos: $$TodoArray) => Ionic(todos.filter(todo => !todo.completed)),
      completed: (todos: $$TodoArray) => Ionic(todos.filter(todo => todo.completed))
   }

   function createTodo(title: string) {
      return IonicTodo({
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
      createTodo
   }
}

type FromAbove<T> = T extends CommonsEntryKey<infer I> ? I : never


// TODO: fromGlobal (checks appwide first then global) only (no fromApp), provideGlobal, and provideAppwide

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
                  use:removeTodo={($todos.removeTodo)}
               ></TodoList>
            </section>
            <footer show:if={$todoCount} class="footer">
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
               <button show:if={($todoCount() > $remaining())} class="clear-completed" on:click={e => $todos.removeCompleted()}>
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
         // doAction(addTodo, [createTodo(value)])
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
   'mu:todos': $<$$TodoArray>,
   'use:removeTodo': (todo: $$<Todo>) => void,
}>) {
   const { mu, $todos, removeTodo, } = input()

   const $editedTodo = Ion(null as Todo | null)

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
            const $isEditing = Ion(() => todo === $editedTodo());

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


function mutateTodo(todo: Todo) {

}

mutateTodo(null as unknown as Readonly<Todo>)

function readTodo(todo: Readonly<Todo>) {

}

readTodo(null as unknown as Todo)