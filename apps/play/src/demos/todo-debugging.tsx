
//@ts-nocheck
// {
//    id: Date.now(),
//    title: 'kermit',
//    completed: false
// }

/* 
//FIX: for both non-memoized and memoized derivation
- NOTE: The bug is not consistent. It swaps between this bug and the following bug.
- from completed view
- click [toggle all] (completed items will show in view)
- click [clear completed]
- BUG: completed items do not clear
*/

/* 
//FIX:
- from active view
- add items
*/

/*
//FIX: 
- from completed view
- click [toggle all]
- BUG: completed items do not show in view
*/
// -disappears when we watch($filtered) and when we turn conditional rendering off

/* //FIX: for both non-memoized and memoized derivation (not consistent, swaps with above bug)
- BUG: clearing all from completed view does not trigger $filteredTodos to empty. It is still using the old ionized todos instead of the new empty ionized todos.
- Disappears when we watch($filteredTodos) but not when we turn conditional rendering off

Bug disappears:
- when we watch($filteredTodos)
- when we turn conditional rendering off
*/

//FIX:
// - toggle all complete
// - toggle all uncomplete
// - manually click complete todos in active or all view
// - go to completed view
// - clear completed
// - completed todos don't disappear. We are stuck


// [ ] is this a render issue (list rendering) or is this a data issue (watch)?
// [ ] does this happen with the conditional rendering turned off?

const filters = {
   all: (todos: Todo[]) => todos,
   active: (todos: Todo[]) => todos.filter((todo) => !todo.completed),
   completed: (todos: Todo[]) => todos.filter((todo) => todo.completed)
}

const $todos = ion.ionize([] as Todo[])
const $visibility = ion('all' as keyof typeof filters)

const $filteredTodos = ion(() => (filters[$visibility()]($todos())))

function toggleAll(e: RadioInputEvent) {
   $todos().forEach((todo) => (todo.completed = e.target.checked))
}

function removeCompleted() {
   $todos.state = filters.active($todos())
}


function addTodo(e: InputEvent) {
   const value = e.target.value.trim()
   if (value) {
      $todos().push({
         id: Date.now(),
         title: value,
         completed: false
      })
      e.target.value = ''
   }
}

function removeTodo(todo: Todo) {
   $todos().splice($todos().indexOf(todo), 1)
}
