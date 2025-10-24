//@ts-nocheck

import { Meanwhile } from "../../../../packages/lumo/src/boundaries/Await"
import { doAction } from "../../../../packages/quarky/src/action/Action"

const markComplete = Action(() => {
   mu(todo).complete = true
}, {
   '@race'(competingAction) {
      if (competingAction.is('markComplete') && competingAction.precedes(this))
         competingAction.cancel()
      else this.cancel()
   },
   catch(err) { },
   tags: ['markComplete'],
   lazy: { limit: 100 },
   await: true
   // queueAfter: ['todo-edits'] (default)
})





e => markComplete(todo)

   (
      <>
         {Await(markComplete,
            <>hi</>
         )}
         {Meanwhile(
            <>loading...</>
         )}
         {Catch(err => (
            <>{err}</>
         ))}
      </>
   )

function markComplete(todo) {
   todo.complete = true
}

e => action(() => {
   markComplete(todo)
},)

const $todos = SuspenseIon({
   initial: undefined,
   fetch: () => db.fetchTodos().then(todos => IonicTodoArray(todos)),
   '@init'() {

   },
   async '@set'(value) { // This is an action... how do we batch the promises?
      await db.setTodos(value)
   },
   standin: () => { }
}, {
   addTodo(todo: $$Todo) {
      this.value.push(todo) // optimistic update
   },

   removeTodo(todo: $$Todo) {
      this.value.splice(this.value.indexOf(todo), 1)
   },

   removeCompleted() {
      this.value = this.value.filter(todo => !todo.completed)
   },

   setCompleteForEach(completed: boolean) {
      this.value.forEach((todo) => (todo.completed = completed))
   },

   isAllComplete() {

   },

   '~pure'() {
      return ['isAllComplete']
   },

   async '@addTodo'(todo: Todo) { // TODO: auto mark stale and unstale 
      await db.addTodo(todo)
   },

   '@removeTodo'(todo: $$Todo) {
      // this.value.splice(this.value.indexOf(todo), 1)
   },

   '@removeCompleted'() {
      // this.value = this.value.filter(todo => !todo.completed)
   },

   '@setCompleteForEach'(completed: boolean) {
      // this.value.forEach((todo) => (todo.completed = completed))
   },
})