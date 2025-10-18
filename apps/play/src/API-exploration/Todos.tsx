
import { component, For, fromRoot, SuspenseIon } from "@rue/lumo";
import { EACH, Ion, Ionic } from "@rue/quarky";

// #region: Model

interface Todo {
   id: string
   title: string,
   completed: boolean
}

class Todos {
   constructor(
      public value: Todo[]
   ) {

   }

   addTodo(todo: Todo) {
      this.value.push(todo)
   }

   removeTodo(todo: Todo) {
      this.value.splice(this.value.indexOf(todo), 1)
   }
}


// #region: Ionic Model
function IonicTodos(data: Todos[]) {
   return Ionic(data, {
      [EACH]: {
         '@init': Ionic
      }
   })
}


fetchTodos.db = RootCommonsKey<TodosDatabase>()

let $todos: SuspenseIon;

function fetchTodos($userID: Ion<string>) {
   const db = fromRoot(fetchTodos.db)
   return $todos ?? ($todos = SuspenseIon({
      initial: [],
      fetch: () => IonicTodos(db.fetchTodos($userID())),
      proto: Todos,
      ['@set']() {

      }
   }, {
      ['@addTodo']() {

      },

      ['@removeTodo']() {

      }
   }))
}



const fetchTodos = defineSharedFetch(($userID: Ion<string>) => {
   const db = fromRoot(fetchTodos.db)

   return SuspenseIon({
      initial: [],
      fetch: () => IonicTodos(db.fetchTodos($userID())),
      proto: Todos,
      ['@set']() {

      }
   }, {
      ['@addTodo']() {

      },

      ['@removeTodo']() {

      }
   })
})



// #region: View

export function TodoApp() {

   const $todos = fetchTodos($userID)

   return component(
      <div>
         {For($todos, m => m.id, (todo) => (
            <div>{todo.title}</div>
         ))}
      </div>
   )
}