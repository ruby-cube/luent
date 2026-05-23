import { $from, $of, component, Else, For, If } from "@rue/luent";
import { ion, ionic } from "@rue/quarky";

type Todo = {
   id: number,
   title: string,
   completed: boolean
}

let id = 0
function genUID() {
   return id++
}



export function TodoList() {

   const todos: Todo[] = ionic([] as Todo[], {
      '-capsule': true,
      insert(todo: Todo, index: number) {
         this.splice(index, 0, todo)
      },
      remove(index: number) {
         return this.splice(index, 1)[0]
      },
      appendNew() {
         const todo = {
            id: genUID(),
            title: '',
            completed: false
         }
         this.push(todo)
         return todo
      }
   })

   const $activeTodo = ion(null as Todo | null)

   function reKeyup(key: string, todo: Todo, index: number) {
      if (key === 'Enter') {
         $activeTodo.value = todo;
         return;
      }
      if (key === 'Delete') {
         todos.remove(index)
         $activeTodo.value = todos[index] ?? todos.appendNew()
         return;
      }
      if (key === 'Space' && modifier === 'command') {
         todo.completed = !todo.completed
      }
   }

   return component(
      <ul on:click={e => $activeTodo() && ($activeTodo.value = null)}>
         {For(todos, byId, (todo, index) =>
            <li on:click={e => !$activeTodo() && ($activeTodo.value = todo)}>
               {If(() => todo === $activeTodo(),
                  <input on:keyup={e => reKeyup(e.code, todo, index())} mu:value={$of(todo).title} />
               )}
               {Else(
                  <>{$of(todo).title}</>
               )}
            </li>
         )}
      </ul>
   )
}

function byId(item: any) {
   return item.id
}