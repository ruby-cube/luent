import { template, For, If, Else, FromTag, listen, isMutableIon, NodeRef } from "@rue/lumo"
import { watch, queueIonicTask, Ion, Ionic, EACH, as, isIon, isGetter, PRELUDE, $_derivation } from "@rue/quarky"

interface Todo {
   id: number
   title: string
   completed: boolean
}

type InputEvent = { target: { value: string }, key: string }
type RadioInputEvent = { target: { checked: boolean } }
type FilterKeys = 'all' | 'active' | 'completed'

type IonicTodo = Ionic<Todo>

const IonicTodos = (todos: Todo[]) => Ionic(todos, { [EACH]: as(Ionic) })

export function TodoMVC() {

   const ætodos = Ion(IonicTodos(getTodos()))
   const æview = Ion('all' as keyof typeof filters)

   const æfilteredTodos = Ion(() => IonicTodos(filters[æview()](ætodos())))
   const æremaining = Ion(() => filters.active(ætodos()).length)
   const ætodoCount = Ion(() => ætodos().length)

   const filters = {
      all: (todos: Todo[]) => todos,
      active: (todos: Todo[]) => todos.filter(todo => !todo.completed),
      completed: (todos: Todo[]) => todos.filter(todo => todo.completed)
   }


   // # handle routing

   listen(window, 'hashchange', () => {
      const route = window.location.hash.replace(/#\/?/, '') as FilterKeys
      if (filters[route]) {
         æview.value = route
      } else {
         window.location.hash = ''
         æview.value = 'all'
      }
   }, { eager: true })


   // # persist state

   function getTodos(): Todo[] {
      const STORAGE_KEY = 'vue-todomvc'

      queueIonicTask(() => {
         localStorage.setItem(STORAGE_KEY, JSON.stringify(ætodos()))
      })

      return JSON.parse(localStorage.getItem(STORAGE_KEY)!) || []
   }


   // # todos methods

   function addTodo(title: string) {
      ætodos().push(Ionic({
         id: Date.now(),
         title,
         completed: false
      }))
   }

   function removeTodo(todo: Ionic<Todo>) {
      ætodos().splice(ætodos().indexOf(todo), 1)
   }

   function removeCompleted() {
      ætodos.value = IonicTodos(filters.active(ætodos()))
   }


   // # toggle completed

   function toggleAll(e: RadioInputEvent) {
      ætodos().forEach((todo) => { todo.completed = e.target.checked })
   }

   const ToggleAllButton = () => (
      <>
         <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            checked={(æremaining() === 0)}
            on:change={toggleAll}
         />
         <label for="toggle-all">Mark all as complete</label>
      </>
   )


   // # remaining todos

   const RemainingCount = () => (
      <span class="todo-count">
         <strong>{æremaining}</strong>
         <span>{(æremaining() === 1 ? ' item' : ' items')} left</span>
      </span>
   )

   const $todoList = NodeRef(TodoList)
   const $h1 = NodeRef('h1')

   return template(
      <>
         <section class="todoapp">
            <header class="header">
               <h1 ref={$h1}>Todos</h1>
               <TodoInput addTodo={addTodo}></TodoInput>
            </header>
            <section class="main">
               {ToggleAllButton()}
               <TodoList ref={$todoList} at:mounted={node => node} todos={æfilteredTodos} removeTodo={removeTodo}></TodoList>
            </section>
            <footer show-if={ætodoCount} class="footer">
               {RemainingCount()}
               <ul class="filters">
                  <li>
                     <a href="#/all" class={(æview() === 'all' && 'selected')}>All</a>
                  </li>
                  <li>
                     <a href="#/active" class={(æview() === 'active' && 'selected')}>Active</a>
                  </li>
                  <li>
                     <a href="#/completed" class={(æview() === 'completed' && 'selected')}>Completed</a>
                  </li>
               </ul>
               <button show-if={(ætodoCount() > æremaining())} class="clear-completed" on:click={removeCompleted}>
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

function TodoInput({ addTodo }: FromTag<{ addTodo: (title: string) => void }>) {

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



function TodoList({ ætodos, removeTodo }: FromTag<{
   todos: Ion<Ionic<Ionic<Todo>[]>>,
   removeTodo: (todo: Ionic<Todo>) => void
}>) {

   const æeditedTodo = Ion(null as Todo | null)

   let beforeEditCache = ''

   function editTodo(todo: Todo) {
      beforeEditCache = todo.title
      æeditedTodo.value = todo
   }

   function cancelEdit(todo: Todo) {
      æeditedTodo.value = null
      todo.title = beforeEditCache
   }

   function doneEdit(todo: Ionic<Todo>) {
      if (æeditedTodo()) {
         æeditedTodo.value = null
         todo.title = todo.title.trim()
         if (!todo.title) removeTodo(todo)
      }
   }
            watch(æeditedTodo, () => {
               console.log('isEditing?', æeditedTodo())
            })

   return template(
      <ul class="todo-list">
         {For(ætodos, m => m.id, (todo) => {
            const æisEditing = Ion(() => todo === æeditedTodo());


            // watch(todo.ætitle, () => {
            //    console.log('$$$ pion title', todo.title)
            // }, { phase: PRELUDE })

            // watch($_derivation(() => todo.title), () => {
            //    console.log('$$$ derivation title', todo.title)
            // }, { phase: PRELUDE })

            return (
               <li class={['todo', { 'completed': todo.æcompleted, 'editing': æisEditing }]}>
                  <div class="view">
                     <input class="toggle" type="checkbox" mu:checked={todo.æcompleted} />
                     <label on:dblclick={(console.log('double click'), e => editTodo(todo))}>{(todo.title)}</label>
                     <button class="destroy" on:click={e => removeTodo(todo)}></button>
                  </div>
                  {If(æisEditing,
                     <input
                        class="edit"
                        type="text"
                        mu:value={todo.ætitle}
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
      .ref({
         message: 'hi'
      })
}


