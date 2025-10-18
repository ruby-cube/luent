import { component, For, If, Else, FromTag, listen } from "@rue/lumo"
import { watch, ion, queueIonicTask, ionize, Ionized, Ion, makeIon, createIon, $$, update, defineDeepIonize } from "@rue/quarky"

// PRO: no need to return an object and destructure (unless you need to pass a single bound method or ions to a render function)
// CONS: Not as composable as kits

type FilterKeys = 'all' | 'active' | 'complete'

class Todo {
   constructor(
      public readonly id: string,
      public title: string,
      public completed: boolean
   ) {

   }
}

const ionizeTodo = defineDeepIonize((value: Todo) => ({
   '@set': {
      title: () => { console.trace() }
   }
}))


const ionizeTodos = defineDeepIonize((value: Todo[]) => ({
   nested: [ionizeTodo]
}))


class IonicTodoApp {

   constructor(
      todos: Todo[],
   ) {
      this.todos = ionizeTodos(todos)

      return ionize(this)
   }

   todos: Ionized<Todo[]>

   filter: FilterKeys = 'all'

   setFilter(value: string) {
      if (value in IonicTodoApp.filters) {
         this.filter = value as FilterKeys
      } else {
         this.filter = 'all'
      }
   }

   static filters = {
      all: (todos: Ionized<Todo[]>) => todos,
      active: (todos: Ionized<Todo[]>) => ionizeTodos(todos.filter(todo => !todo.completed)),
      completed: (todos: Ionized<Todo[]>) => ionizeTodos(todos.filter(todo => todo.completed))
   }

   get filteredTodos() {
      return IonicTodoApp.filters[this.filter](this.todos)
   }

   get remaining() {
      return IonicTodoApp.filters.active(this.todos).length
   }

   addTodo(title: string) {
      this.todos.push(ionizeTodo({
         id: Date.now(),
         title,
         completed: false
      }))
   }

   removeTodo(todo: Todo) {
      this.todos = ionizeTodos(this.todos.filter(item => item !== todo))
   }

   removeCompleted() {
      this.todos = IonicTodoApp.filters.active(this.todos)
   }

   toggleAll(completed: boolean) {
      this.todos.forEach((todo) => (todo.completed = completed))
   }

   // # todo procedures

   updateTodo(todo: Ionized<Todo>, title: string) {
      todo.title = title;
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

   const app = new IonicTodoApp(getTodos())

   const { $filteredTodos, removeTodo, updateTodo } = $from(app)

   queueIonicTask(() => {
      storeTodos(app.todos)
   })

   // # handle routing
   window.addEventListener('hashchange', onHashChange)
   onHashChange()

   function onHashChange() {
      const route = window.location.hash.replace(/#\/?/, '')
      app.setFilter(route) ?? (window.location.hash = '')
   }

   return component(
      <>
         <section class="todoapp">
            <header class="header">
               <h1>Class: Todos</h1>
               <TodoInput can:addTodo={(app.addTodo)}></TodoInput>
            </header>
            <section class="main">
               <CheckBox can:toggleAll={(app.toggleAll)} ctx={app}></CheckBox>
               {TodoList($filteredTodos, removeTodo, updateTodo)}
            </section>
            <footer show:if={(app.todos.length)} class="footer">
               <Remaining count={(app.remaining)}></Remaining>
               <ul class="filters">
                  <li>
                     <a href="#/all" class={{ 'selected': (app.filter === 'all') }}>All</a>
                  </li>
                  <li>
                     <a href="#/active" class={{ 'selected': (app.filter === 'active') }}>Active</a>
                  </li>
                  <li>
                     <a href="#/completed" class={{ 'selected': (app.filter === 'completed') }}>Completed</a>
                  </li>
               </ul>
               <button show:if={(app.todos.length > app.remaining)} class="clear-completed" on:click={(app.removeCompleted)}>
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

type InputEvent = { target: { value: string }, key: string }
type RadioInputEvent = { target: { checked: boolean } }


function TodoInput(input: FromTag<{
   'can:addTodo': (title: string) => void
}>) {
   const { addTodo } = input

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



function TodoList(input: FromTag<{
   todos: Ion<Ionized<Todo[]>>,
   'can:removeTodo': (todo: Ionized<Todo>) => void,
   'can:updateTodo': typeof IonicTodoApp['updateTodo']
}>) {
   const { $todos, removeTodo, updateTodo } = input;

   const $editedTodo = Ion(null as Todo | null)

   let titleCache = ''

   function editTodo(todo: Todo) {
      titleCache = todo.title
      $editedTodo.value = todo
   }

   function cancelEdit(todo: Todo) {
      $editedTodo.value = null
      updateTodo(todo, titleCache)
   }

   function doneEdit(todo: Ionized<Todo>) {
      if ($editedTodo()) {
         $editedTodo.value = null
         updateTodo(todo, todo.title.trim())
         if (!todo.title) removeTodo(todo)
      }
   }

   return component(
      <ul class="todo-list">
         {For($todos, o => o.id, (todo) => {
            const $isEditing = Ion(() => todo === $editedTodo());

            return (
               <li class={{ todo: true, completed: (todo.completed), editing: $isEditing }}>
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

type Ctx<T> = T // TODO: this should allow ionized object to be destructured, toIons

function CheckBox(input: FromTag<{
   'can:toggleAll': IonicTodoApp['toggleAll']
   ctx: Ctx<{ remaining: IonicTodoApp['remaining'] }>
}>) {
   const { toggleAll, ctx: { $remaining } } = input

   return component(
      <>
         <input
            id="toggle-all"
            class="toggle-all"
            type="checkbox"
            checked={($remaining() === 0)}
            on:change={e => toggleAll(e.target.checked)}
         />
         <label for="toggle-all">Mark all as complete</label>
      </>
   )
}

function Remaining(input: FromTag<{
   count: Ion<number>
}>) {
   const { $count } = input

   return component(
      <span class="todo-count">
         <strong>{$count}</strong>
         <span>{($count() === 1 ? ' item' : ' items')} left</span>
      </span>
   )
}