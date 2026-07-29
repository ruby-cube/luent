//@ts-nocheck
import { EACH, Ion, Ionized, ionize } from "@luent/quarky";

interface Todo {
   id: number
   title: string
   completed: boolean,
}

type FilterKeys = 'all' | 'active' | 'completed'
// type Ionic<T extends object> = Ionized<T>



type DeepIonic<T extends object> = Ionized<T>

type Ionic<T = {}, M = {}> = T & { '~ionized': true }

type IonicTodos = Ionic<Ionic<Todo>[]>


class IonicTodoApp {

   filter: FilterKeys = 'all'
   todos: IonicTodos;

   static filters = {
      all: (todos: IonicTodos) => todos,
      active: (todos: IonicTodos) => Ionized(todos.filter(todo => !todo.completed)),
      completed: (todos: IonicTodos) => Ionized(todos.filter(todo => todo.completed))
   }

   constructor(
      todos: Todo[]
   ) {
      this.todos = Ionized(todos, { [EACH]: Ionized })

      return Ionized(this)
   }

   get filteredTodos() {
      return IonicTodoApp.filters[this.filter](this.todos)
   }

   get remaining() {
      return IonicTodoApp.filters.active(this.todos).length
   }

   addTodo(title: string) {
      // const item = ionize()

      this.todos.push(
         Ionized({
            id: Date.now(),
            title,
            completed: false
         })
      )

      // const lastItem = this.todos.pop()

      // this.todos.push(lastItem) // FIX: should update list rendering

      // console.log('IDENTITY?', item === lastItem) //FIX: Identity hazard
   }

   removeTodo(todo: Todo) {
      this.todos = ionize(this.todos.filter(item => item !== todo))
   }

   removeCompleted() {
      this.todos = IonicTodoApp.filters.active(this.todos)
   }

   toggleAll(completed: boolean) {
      this.todos.forEach((todo) => (todo.completed = completed))
   }
}

