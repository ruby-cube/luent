
import { component, For, fromRoot, AsyncIon } from "@rue/lumo";
import { EACH, Ion, Ionic } from "@rue/quarky";
import { prototype } from "events";
import { UseShared } from "../../../../packages/utils/UseShared";
import { getActiveFlask } from "@rue/flask";

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


fetchTodos.db = RootContextKey<TodosDatabase>()

let $todos: AsyncIon;

function fetchTodos($userID: Ion<string>) {
   const db = fromRoot(fetchTodos.db)
   return $todos ?? ($todos = AsyncIon({
      initial: [],
      fetch: () => IonicTodos(db.fetchTodos($userID())),
      prototype: Todos,
   }, {
      '@set value'() {

      },

      '@addTodo'() {

      },

      '@removeTodo'() {

      }
   }))
}



const fetchTodos = UseShared(($userID: Ion<string>) => {
   const db = fromRoot(fetchTodos.db)

   return AsyncIon({
      initial: [],
      fetch: () => IonicTodos(db.fetchTodos($userID())),
      proto: Todos,
   }, {
      '@set value'() {

      },
      '@addTodo'() {

      },

      '@removeTodo'() {

      }
   })
})




// const todos = Ion([], Todos, {

// })


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