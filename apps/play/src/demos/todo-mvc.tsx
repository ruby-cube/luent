import { component, For, If } from "@rue/lumo"
import { AtomicIon, Ion, ion, ionicTask, o$, watch } from "@rue/quarky"
import { quarkOf } from "../../../../packages/quarky/src/Quark"
import { RENDER } from "../../../../packages/lumo/src/render/render-cycle"

//FIXED :)
/*
- starting from #completed view, add item
- change to #all view, item will appear, but any subsequent items added will not show
*/

/* 
//FIX:
- BUG: using a non-memoized derivation for $filteredTodos breaks things even more.
*/

/* 
//FIX: for both non-memoized and memoized derivation
- NOTE: The bug is not consistent. It swaps between this bug and the following bug.
- from completed view
- click [toggle all] (completed items will show in view)
- click [clear completed]
- BUG: completed items do not clear
*/

/* //FIX: for both non-memoized and memoized derivation (not consistent, swaps with above bug)
- BUG: clearing all from completed view does not trigger $filteredTodos to empty. It is still using the old ionized todos instead of the new empty ionized todos.
*/

type Todo = {
   id: number,
   title: string,
   completed: boolean
}

type InputEvent = { target: { value: string }, key: string }
type RadioInputEvent = { target: { checked: boolean } }


export function TodoMVC() {


   const STORAGE_KEY = 'vue-todomvc'

   const filters = {
      all: (todos: Todo[]) => todos,
      active: (todos: Todo[]) => todos.filter((todo) => (console.log('active todo', todo), !todo.completed)),
      completed: (todos: Todo[]) => todos.filter((todo) => (console.log('completed todo', todo), todo.completed))
   }
   // {
   //    id: Date.now(),
   //    title: 'kermit',
   //    completed: false
   // }

   // get state
   const $todos = ion.ionize([] as Todo[])
   const $visibility = ion('all' as keyof typeof filters)
   const $editedTodo = ion(null as Todo | null)

   //@ts-expect-error
   $todos.labelName = '$todos'
   //@ts-expect-error
   $visibility.labelName = '$visibility'

   // derive state
   // const $filteredTodos = () => (filters[$visibility()]($todos()))
   const $filteredTodos = ion(() => (console.log("@% derive $filteredTodos"), filters[$visibility()]($todos())))
   //@ts-expect-error
   $filteredTodos.__DEV__label('$filteredTodos')

   // console.log($filteredTodos())
   // console.log(quarkOf($filteredTodos).asCompound?.particles)

   const $remaining = ion(() => (console.log("@% derive $remaining"), filters.active($todos()).length))
   //@ts-expect-error
   $remaining.__DEV__label('$remaining')


   // watch($filteredTodos, ({ prevState, state }) => {
   //    console.log('@% ---------')
   //    //@ts-expect-error
   //    console.log('@% $filteredTodos particles', quarkOf($filteredTodos).asCompound?.particles)
   //    console.log('@% prevState', prevState.length, prevState)
   //    console.log('@% state', state.length, state)
   //    console.log('@%')
   // })

   // watch($filteredTodos, ({ prevState, state }) => {
   //    console.log('@% --------- RENDER PHASE')
   //    //@ts-expect-error
   //    console.log('@% $filteredTodos particles', quarkOf($filteredTodos).asCompound?.particles)
   //    console.log('@% prevState', prevState.length, prevState)
   //    console.log('@% state', state.length, state)
   //    console.log('@%')
   // }, {phase: RENDER})

   // watch($remaining, ()=>{})

   // handle routing
   window.addEventListener('hashchange', onHashChange)
   onHashChange()

   // // persist state
   // ionicTask(w => {
   //    localStorage.setItem(STORAGE_KEY, JSON.stringify(w($todos)))
   // })

   function toggleAll(e: RadioInputEvent) {
      console.log("@% ")
      console.log("@% EVENT---------------------toggleAll")
      console.log("@% toggleAll(radioInputEvent)")
      $todos().forEach((todo) => (todo.completed = e.target.checked))
   }

   function addTodo(e: InputEvent) {
      console.log("@% ")
      console.log("@% EVENT---------------------addTodo")
      console.log("@% addTodo(inputEvent)")
      const value = e.target.value.trim()
      if (value) {
         $todos().push({
            id: Date.now(),
            title: value,
            completed: false
         })
         e.target.value = ''
         // console.log('$filtered todos particles', quarkOf($filteredTodos).asCompound?.particles)
      }
   }

   function removeTodo(todo: Todo) {
      console.log("@% ")
      console.log("@% EVENT---------------------removeTodo")
      console.log("@% removeTodo(todo)")
      $todos().splice($todos().indexOf(todo), 1)
   }

   let beforeEditCache = ''
   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      $editedTodo.state = todo
   }

   function cancelEdit(todo: Todo) {
      $editedTodo.state = null
      todo.title = beforeEditCache
   }

   function doneEdit(todo: Todo) {
      if ($editedTodo()) {
         $editedTodo.state = null
         todo.title = todo.title.trim()
         if (!todo.title) removeTodo(todo)
      }
   }

   function removeCompleted() {
      console.log("@% ")
      console.log("@% EVENT---------------------removeCompleted")
      console.log("@% removeCompleted()")
      $todos.state = filters.active($todos())
   }

   function onHashChange() {
      const route = window.location.hash.replace(/#\/?/, '') as keyof typeof filters
      console.log("@% ")
      console.log("@% EVENT---------------------change view", route)
      console.log("@% onHashChange()", route)
      if (filters[route]) {
         $visibility.state = route
         console.log('set visibility state to', route)
      } else {
         window.location.hash = ''
         $visibility.state = 'all'
      }
   }
   return component(
      <>
         <section class="todoapp">
            <header class="header">
               <h1>Todos</h1>
               <input
                  class="new-todo"
                  autofocus
                  placeholder="What needs to be done?"
                  on:keyup={e => e.key === 'Enter' && addTodo(e as unknown as InputEvent)}
               />
            </header>
            {If($todos().length, "create",
               <section class="main">
                  <input
                     id="toggle-all"
                     class="toggle-all"
                     type="checkbox"
                     checked={$remaining() === 0}
                     on:change={e => toggleAll(e as unknown as RadioInputEvent)}
                  />
                  <label for="toggle-all">Mark all as complete</label>
                  <ul class="todo-list">
                     {For($filteredTodos, m => m.id, todo => (console.log('@% render new todo', todo),
                        <li class={["todo", { completed: $ = todo.completed, editing: todo === $editedTodo() }]}>
                           <div class="view">
                              <input class="toggle" type="checkbox" mu:checked={o$(todo).$completed} on:input={e => {
                                 //@ts-expect-error
                                 console.log("@% EVENT---------click todo checkbox", e.target.checked)
                              }} />
                              <label on:dblclick={e => editTodo(todo)}>{o$(todo).$title}</label>
                              <button class="destroy" on:click={e => removeTodo(todo)}></button>
                           </div>
                           {If(todo === $editedTodo(),
                              <input
                                 class="edit"
                                 type="text"
                                 mu:value={o$(todo).$title}
                                 // @vue:mounted="({el}) => el.focus()"
                                 on:blur={e => doneEdit(todo)}
                                 on:keyup={e => e.key === 'Enter' && doneEdit(todo) || e.key === 'Escape' && cancelEdit(todo)}
                              />
                           )}
                        </li>
                     ))}
                  </ul>
               </section >
            )}
            {If($todos().length, 'mount', //FIX: when this is 'create' it doesn't show up :(
               <footer class="footer">
                  <span class="todo-count">
                     <strong>{$remaining}</strong>
                     <span>{$remaining() === 1 ? ' item' : ' items'} left</span>
                  </span>

                  <ul class="filters">
                     <li>
                        <a href="#/all" class={{ selected: $visibility() === 'all' }}>All</a>
                     </li>
                     <li>
                        <a href="#/active" class={{ selected: $visibility() === 'active' }}>Active</a>
                     </li>
                     <li>
                        <a href="#/completed" class={{ selected: $visibility() === 'completed' }}>Completed</a>
                     </li >
                  </ul >

                  {If($todos().length > $remaining(), 'mount',
                     <button class="clear-completed" on:click={removeCompleted} >
                        Clear completed
                     </button >
                  )}
               </footer >
            )}
         </section >
         <$--link href="https://unpkg.com/todomvc-app-css@2.4.1/index.css" rel="stylesheet" />
      </>)
}

{/* <style>
@import "https://unpkg.com/todomvc-app-css@2.4.1/index.css";
</style> */}