import { component, For, If, Else, FromTag, listen, isMutableIon } from "@rue/lumo"
import { watch, queueIonicTask, Ion, Ionic, toRaw, EACH, $_derivation } from "@rue/quarky"
import { PRELUDE } from "../../../../packages/quarky/src/reactivity/RenderCycle"
import { create } from "domain"
import { inTrackedScope } from "../../../../packages/quarky/src/reactivity/Compound"
import { QUARK } from "../../../../packages/quarky/src/abstract/Quark"

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

export function TodoMVC() {

   const $todos = Ion(Ionic(getTodos(), { [EACH]: { as: Ionic } }))
   const $view = Ion('all' as keyof typeof filters)

   const $filteredTodos = Ion(() => filters[$view()]($todos()))
   const $remaining = Ion(() => {
      'remaining';
      // return filters.active($todos()).length
      const todos = filters.active(
         $todos()
      )
      // console.trace('remaining todos', todos)
      return todos.length
   }) // FIX: when this is memoized, it breaks
   const $todoCount = Ion(() => $todos().length)

   const filters = {
      all: (todos: Ionized<Todo[]>) => todos,
      active: (todos: Ionized<Todo[]>) => todos.filter(todo => {
         console.log('is Proxy?', todo)
         return !todo.completed
      }),
      completed: (todos: Ionized<Todo[]>) => todos.filter(todo => todo.completed)
   }


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

      queueIonicTask(() => {
         localStorage.setItem(STORAGE_KEY, JSON.stringify($todos())) // FIX: Do can we eliminate toRaw()?
      })

      return JSON.parse(localStorage.getItem(STORAGE_KEY)!) || []
   }


   // # todos methods

   function addTodo(title: string) {
      const item = Ionic({
         id: Date.now(),
         title,
         completed: false
      })
      $todos().push(item)
      // const lastItem = $todos().pop();
      // $todos().push(lastItem!)
   }

   watch($todos, () => {
      console.log('### todos changed')
   })

   function removeTodo(todo: Ionized<Todo>) {
      $todos().splice($todos().indexOf(todo), 1)
      // $todos.value = Ionized($todos().filter(item => item !== todo))
   }

   function removeCompleted() {
      $todos.value = filters.active($todos())
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


   return component(
      <>
         <section class="todoapp">
            <header class="header">
               <h1>Todos</h1>
               <TodoInput use:addTodo={addTodo}></TodoInput>
            </header>
            <section class="main">
               {ToggleAllButton()}
               <TodoList todos={$filteredTodos} use:removeTodo={removeTodo}></TodoList>
            </section>
            <footer show-hide={$todoCount} class="footer">
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
               <button show-hide={($todoCount() > $remaining())} class="clear-completed" on:click={removeCompleted}>
                  Clear completed
               </button>
            </footer>
         </section>

         {/* <Test message={'hi'} count={3}></Test> */}

         <o--link href="https://unpkg.com/todomvc-app-css@2.4.1/index.css" rel="stylesheet" />
      </>)
}

{/* <style>
@import "https://unpkg.com/todomvc-app-css@2.4.1/index.css";
</style> */}

// function Test({ message }, { count = 0 }) {
//    return component(
//       <div></div>
//    )
// }

function TodoInput({ addTodo }: FromTag<{ 'use:addTodo': (title: string) => void }>) {

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


// INPUT TYPING
// ------------
// number (static)
// Ion<number>
// ToIon<number> (will normalize to ion)
// Frog (static/data) (readonly, will copy before ionizing)
// Ionized<Frog>
// ToIonized<Frog> (will normalize ionized)
// To<IonicFrog>


function TodoList(input: FromTag<{
   todos: Ion<Ionized<Todo[]>>,
   'use:removeTodo': (todo: Ionized<Todo>) => void
}>) {

   const { $todos, removeTodo } = input

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
                     <input class="toggle" type="checkbox" mu:checked={todo.$completed} />
                     <label on:dblclick={e => editTodo(todo)}>{(todo.title)}</label>
                     <button class="destroy" on:click={e => removeTodo(todo)}></button>
                  </div>
                  {If($isEditing,
                     <input
                        class="edit"
                        type="text"
                        mu:value={todo.$title}
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


