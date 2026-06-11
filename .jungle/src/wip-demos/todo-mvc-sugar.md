```tsx
import { template, For, If, Else, FromTag } from "%rue/luent"
import { watch, trackEffect, ionize, Ionized, Ion, $, makeIon, createIon, $$ } from "%rue/quarky"
import { PRELUDE } from "../../../../packages/luent/src/render-cycle"
import { create } from "domain"
import { inTrackedScope } from "../../../../packages/quarky/src/compound/Compound"

get count = ion(0, {
   increment() {
      count++
   }
})

// const count = ion(0, {
//    increment() {
//       count.value++
//    }
// })

count@
// count

count@.increment()
// count.increment()

console.log(count)
// console.log(count())

count++
// count.value++

obj.foo@
// Object.getOwnPropertyDescriptor(obj, 'foo').get
// $(obj, 'foo')
// obj.$foo




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

const ionizeTodo = defineDeepIonize({
   __DEV__debug: {
      '@set title': () => { console.trace() }
   }
})

const ionizeTodos = defineDeepIonize({
   [EACH]: ionizeTodo
})

type FilterKeys = 'all' | 'active' | 'completed'

export function TodoMVC() {

   get todos = ion(ionic(getTodos(), { [EACH]: { '-as': IonicTodo } }))
   get view = ion('all' as keyof typeof filters)

   get filteredTodos = ion(() => filters[view](todos))
   get remaining = ion(() => filters.active(todos).length)
   get todoCount = ion(() => todos.length)

   const filters = {
      all: (todos: Ionic<Todo[]>) => todos,
      active: (todos: Ionic<Todo[]>) => ionizeTodos(todos.filter(todo => !todo.completed)),
      completed: (todos: Ionic<Todo[]>) => ionizeTodos(todos.filter(todo => todo.completed))
   }

   function addTodo(title: string) {
      todos.push(ionizeTodo({
         id: Date.now(),
         title,
         completed: false
      }))
   }

   function removeTodo(todo: Ionized<Todo>) {
      todos = ionizeTodos(todos.filter(item => item !== todo))
   }

   function removeCompleted() {
      todos = filters.active($todos())
   }

   function toggleAll(e: RadioInputEvent) {
      todos.forEach((todo) => (todo.completed = e.target.checked))
   }


   // # handle routing

   window.addEventListener('hashchange', onHashChange)
   onHashChange()

   function onHashChange() {
      const route = window.location.hash.replace(/#\/?/, '') as FilterKeys
      if (filters[route]) {
         view = route
      } else {
         window.location.hash = ''
         view = 'all'
      }
   }



   // # persist state

   function getTodos(): Todo[] {
      const STORAGE_KEY = 'vue-todomvc'

      trackEffect(() => {
         localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
      })

      return JSON.parse(localStorage.getItem(STORAGE_KEY)!) || []
   }


   return template(
      <>
         <section class="todoapp">
            <header class="header">
               <h1>Todos</h1>
               {TodoInput(addTodo)}
            </header>
            <section class="main">
               {CheckBox(toggleAll, asCtx(app))}
               {TodoList(todos@, removeTodos)}
            </section>
            <footer show-if={todoCount@} class="footer">
               {RemainingCount(remaining@)}
               <ul class="filters">
                  <li>
                     <a href="#/all" class={{ 'selected': (view === 'all') }}>All</a>
                  </li>
                  <li>
                     <a href="#/active" class={{ 'selected': (view === 'active') }}>Active</a>
                  </li>
                  <li>
                     <a href="#/completed" class={{ 'selected': (view === 'completed') }}>Completed</a>
                  </li>
               </ul>
               <button show-if={(todoCount > remaining)} class="clear-completed" on:click={removeCompleted}>
                  Clear completed
               </button>
            </footer>
         </section>

         <o-link href="https://unpkg.com/todomvc-app-css%2.4.1/index.css" rel="stylesheet" />
      </>)
}

{/* <style>
%import "https://unpkg.com/todomvc-app-css%2.4.1/index.css";
</style> */}

{/* <TodoList todos={%filteredTodos} can:removeTodo={removeTodo}></TodoList> */}
{/* <TodoInput can:addTodo={addTodo}></TodoInput> */}



const CheckBox = (toggleAll: () => void, remaining@: Ion<number, { increment: () => void}>) => (
   <>
      <input
         id="toggle-all"
         class="toggle-all"
         type="checkbox"
         checked={(remaining === 0)}
         on:change={toggleAll}
      />
      <label for="toggle-all">Mark all as complete</label>
   </>
)



const RemainingCount = (remaining@: number) => (
   <span class="todo-count">
      <strong>{remaining}</strong>
      <span>{(remaining === 1 ? ' item' : ' items')} left</span>
   </span>
)



function TodoInput(addTodo: (title: string) => void }>) {

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



function TodoList(todos@: Ionic<Todo[]>, removeTodo: (todo: Ionic<Todo>) => void }) {

   let editedTodo = ion(null as Todo | null)

   let beforeEditCache = ''

   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      editedTodo = todo
   }

   function cancelEdit(todo: Todo) {
      editedTodo = null
      todo.title = beforeEditCache
   }

   function doneEdit(todo: Ionized<Todo>) {
      if (editedTodo) {
         editedTodo = null
         todo.title = todo.title.trim()
         if (!todo.title) removeTodo(todo)
      }
   }

   return (
      <ul class="todo-list">
         {For(todos@, o => o.id, (todo) => {
            get isEditing = ion(() => todo === editedTodo);

            todos@.addItem(new Todo())

            return (
               <li class={{ todo: true, completed: todo.completed@, editing: isEditing@ }}>
                  <div class="view">
                     <input class="toggle" type="checkbox" mu:checked={todo.completed@} />
                     <label on:dblclick={e => editTodo(todo)}>{todo.title@}</label>
                     <button class="destroy" on:click={e => removeTodo(todo)}></button>
                  </div>
                  {If(isEditing@,
                     <input
                        class="edit"
                        type="text"
                        mu:value={todo.title@}
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




function TodoInput({ addTodo }: { 'can:addTodo': (title: string) => void }) {

   function submitTodo(e: InputEvent) {
      const value = e.target.value.trim()
      if (value) {
         addTodo(value)
         e.target.value = ''
      }
   }

   return template(
      <input
         class="new-todo"
         autofocus
         placeholder="What needs to be done?"
         on:keyup={e => e.key === 'Enter' && submitTodo(e as unknown as InputEvent)}
      />
   )
}



function TodoList({ todos@, removeTodo }: {
   todos: Ion<Ionic<Todo[]>>,
   'can:removeTodo': (todo: Ionic<Todo>) => void
}) {

   get editedTodo = ion(null as Todo | null)

   let beforeEditCache = ''

   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      editedTodo = todo
   }

   function cancelEdit(todo: Todo) {
      editedTodo = null
      todo.title = beforeEditCache
   }

   function doneEdit(todo: Ionic<Todo>) {
      if (editedTodo) {
         editedTodo = null
         todo.title = todo.title.trim()
         if (!todo.title) removeTodo(todo)
      }
   }

   return template(
      <ul class="todo-list">
         {For(todos@, o => o.id, (todo) => {
            get isEditing = ion(() => todo === editedTodo);

            return (
               <li class={{ todo: true, completed: todo.completed@, editing: isEditing@ }}>
                  <div class="view">
                     <input class="toggle" type="checkbox" mu:checked={todo.completed@} />
                     <label on:dblclick={e => editTodo(todo)}>{todo.title@}</label>
                     <button class="destroy" on:click={e => removeTodo(todo)}></button>
                  </div>
                  {If(isEditing@,
                     <input
                        class="edit"
                        type="text"
                        mu:value={todo.title@}
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


```