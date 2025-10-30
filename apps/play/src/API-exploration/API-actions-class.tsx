// @ts-nocheck
import { SuspenseIon } from "@rue/lumo";
import { Ionic } from "@rue/quarky";



function IonicTodos(data: Todo[], { refetch }) {
   return Ionic(data, {
      [EACH]: nest(IonicTodo)
   })
}

// TODO: 

const $todos = AsyncIon(() => fetchTodos($userID))
// const $todos = ResolvedIon(() => fetchTodos($userID))

// DECIDE: Should there be a distinction between AsyncIon and ResolvedIon?
// - the pull for ResolvedIon is to get rid of the undefined in the type, but that's kinda a lie
//   if you console log $todos() right after fetchTodos, it will be undefined. It's just that the component is not mounted until it is ready
// - even thought it's annoying to have an undefined typing, maybe we should just keep it there and throw all AsyncIon's promises
// - AsyncIon's promises can be awaited within the component or "from above"

const $todos = AsyncIon({
   fetch: () => fetchTodos($userID),
   reawait: true
})



const $todos = AsyncIon({
   initial: [],
   fetch: () => IonicTodos(db.fetchTodos()),
   '@init'() {
      onTodosUpdated(applyMutations => { // TODO: How do you coordinate these real-time updates with everything else?
         applyMutations()
      })
   }
}, {

   // TODO:
   // 1) proto
   // 2) method overrides
   // 3) extensions

   // - access to this

   [PROTO]: Todos,

   // addTodo(todo) {
   //    this.value.push(todo)
   // },

   addTodo: AsyncAction({
      dispatch({ ooo }, todo) {
         ooo.await(db.addTodo(todo))
            .then(() => $todos.refetch())
            .catch(err => { })
      }
   }),

   delTodo: AsyncAction({
      dispatch({ ooo }, todo) {
         ooo.await(db.delTodo(todo))
            .then(() => $todos.refetch())
            .catch(err => { })
      }
   }),

   deleteTodo: AsyncAction({
      optimistic(index: number) {
         return $todos().deleteTodo(index, 1)
      },
      dispatch({ ooo }, index) {
         ooo.await(db.deleteTodo(index))
            .catch(err => { })
      },
   }),

   removeTodo: AsyncAction({
      optimistic(index: number) {
         return $todos().deleteTodo(index, 1)
      },
      dispatch({ ooo, output }, index) {
         ooo.await(db.deleteTodo(index))
            .catch(err => { })
      },
   }),

   complexOp: AsyncAction({
      dispatch({ ooo, output }, index) {
         mu($something).value = 0

         ooo.await(db.deleteTodo(index))
            .catch(err => { })
      },
      '@race': rival => rival.cancel()
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

      updateTitle: AsyncAction({
         optimistic(title: string) {
            todo.updateTitle(title)
         }
      })
   })

   return todo;
}

// There are two/three types of AsyncOps
// - optimistic + dispatch (logic on client)
// - dispatch
//    - simple (logic on server)
//    - complex (logic on client and server)

// optimistic: rendered responsively like sync operations, ops cannot be cancelled
// dispatch: rendering is delayed until dispatch is resolved, if op is cancelled, state is rolled back

// note that @race is different from cancelling previous fetches/dispatches, $race is about overlapping mutations
// cancelling previous fetches/dispatches is handled under the hood with last op wins strategy


// Actions batch reads and writes, including within pre-render effects
const doSomething = Action(function () {

})

action(() => mu($seconds).value++)