// @ts-nocheck
import { SuspenseIon } from "@rue/lumo";
import { Ionic } from "@rue/quarky";



function IonicTodos(data: Todo[], { refetch }) {
   return Ionic(data, {
      [EACH]: nest(IonicTodo)
   })
}

const $todos = AsyncIon({
   initial: [],
   fetch: () => IonicTodos(db.fetchTodos()),
   preresolve: true
}, {
   [PROTO]: Todos,

   // addTodo(todo) {
   //    this.value.push(todo)
   // },

   addTodo: AsyncOp({
      dispatch({ ooo, abort }, todo) {
         ooo.await(db.addTodo(todo))
            .then(() => $todos.refetch())
            .catch(err => { })
      }
   }),

   deleteTodo: AsyncOp({
      optimistic(index: number) {
         return this.deleteTodo(index, 1)
      },
      dispatch({ ooo, abort }, index) {
         ooo.await(db.deleteTodo(index))
            .catch(err => { })
      }
   })
})

function IonicTodo(data: Todo) {
   const todo = Ionic(new Todo(data), {
      author: nest(IonicProfile),

      completed: AsyncIon({
         initial: data.completed,
         optimistic: true,
         dispatch({ ooo }, value) {
            ooo.await(db.setCompleted(value))
         },
         // debounce: 500
      }),

      updateTitle: AsyncOp({
         optimistic(title: string) {
            todo.updateTitle(title)
         }
      })
   })
   
   return todo;
}