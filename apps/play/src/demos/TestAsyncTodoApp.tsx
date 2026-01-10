import { FromTag, AsyncIon, If, Suspense } from "@rue/lumo";
import { Await, Meanwhile } from "../../../../packages/lumo/src/boundaries/Await";
import { EACH, Ion, Ionic } from "@rue/quarky";




const ENTER_KEY = 13;

const generateId = () => Date.now().toString(36);

const IonicTodo = (data) => {
   const todo = depot.get(data.id) ?? depot.create(() => Ionic(data))
   return todo
}

const IonicTodos = todos => Ionic(todos, { [EACH]: IonicTodo })

export default function TodoApp() {
   const $todos = AsyncIon([], () => db.fetchTodos(), { ionize: IonicTodos })

   // const addTodo = async (todo: Todo) => {
   //    await db.addTodo(todo);
   //    $todos.refetch();
   // }

   // const removeTodo = async (todoID: string) => {
   //    await db.removeTodo(todoId);
   //    $todos.refetch();
   // }

   // const toggleCompleted = async (todo: Todo, index: number, completed: boolean) => {
   //    const { completed } = await db.toggleTodo(todo.id, completed)
   //    todo.completed = completed;
   // }

   const addTodo = AsyncAction((todo: Todo) => {
      oo.await(db.addTodo(todo), () =>
         $todos.refetch()
      )
   })

   const removeTodo = AsyncAction((todoID: string) => {
      oo.await(db.removeTodo(todoId), () =>
         $todos.refetch()
      )
   })

   return (
      <section class="todoapp">
         <header class="header">
            <h1>todos</h1>
         </header>
         <TodoInput addTodo={addTodo} />
         {Await($todos, // TODO: first load vs refetches
            <div>
               <TodoList
                  todos={$todos}
                  removeTodo={removeTodo}
               />
            </div>
         )}
         {Meanwhile(
            <div class="loading">Loading...</div>
         )}
      </section>
   );
}

function TodoInput(input: FromTag<{
   addTodo: AsyncOp<(todo: Todo) => Promise<any>>;
}>) {
   const { addTodo } = input

   const reKeyDown: KeyboardEventHandler<HTMLInputElement> = ({
      target,
      keyCode,
   }) => {
      const title = target.value.trim();
      if (keyCode === ENTER_KEY && title) {
         addTodo.dispatch({ title, id: generateId(), completed: false });
         target.value = '';
      }
   };

   return (
      <div style={{ display: 'flex' }}>
         <input
            class="new-todo"
            placeholder="What needs to be done?"
            on:keydown={reKeyDown}
         />
         <span>{(addTodo.pending ? 'PENDING' : '')}</span>
      </div>
   );
}

function TodoInput(input: FromTag<{
   addTodo: AsyncOp<(todo: Todo) => Promise<any>>;
}>) {
   const { addTodo } = input

   const reKeyDown: KeyboardEventHandler<HTMLInputElement> = ({
      target,
      keyCode,
   }) => {
      const title = (target as HTMLInputElement).value.trim();
      if (keyCode === ENTER_KEY && title) {
         const todo = { title, id: generateId(), completed: false };
         addTodo.dispatch(todo); // TODO: what happens if dispatches overlap? queue? run in parallel? override? drop?
         (target as HTMLInputElement).value = '';
      }
   };

   return (
      <div style={{ display: 'flex' }}>
         <input
            class="new-todo"
            placeholder="What needs to be done?"
            on:keydown={reKeyDown}
         />
         <span>{(addTodo.pending ? 'PENDING' : '')}</span>
      </div>
   );
}

function TodoList(input: FromTag<{
   todos: Ion<Todo[]>;
   removeTodo: (id: string) => Promise<void>;
}>) {
   const { $todos, removeTodo } = input

   return (
      <section class="main">
         <ul class="todo-list">
            {For($todos, (todo) => (
               <Todo
                  key={todo.id}
                  todo={todo}
                  removeTodo={removeTodo}
               />
            ))}
         </ul>
      </section>
   );
}

function Todo({
   todo,
   removeTodo,
}: FromTag<{
   todo: Todo;
   removeTodo: (id: string) => Promise<void>;
}>) {
   const $isRemoving = Ion(false);

   // [] Race
   // [] Optimistic
   // [] retry
   // [] realtime races

   const toggleCompleted = AsyncAction((todo: Todo, completed: boolean) => {
      // cancel fetches

      // prep rollback
      const prev = todo.completed
      toggleCompleted.rollback = () => todo.completed = prev

      // optimistic update
      todo.completed = checked; 

      return oo
         .await(db.toggleTodo(todo.id, completed), ({ completed, modifiedDate }) => {
            todo.completed = completed
            todo.modifiedDate = modifiedDate
         })
         .catch(err => {
            console.log(err)
         })
         .finally(() => {

         })
   })

   const reRemoveBtnClick = () => {
      $isRemoving.value = true;
      removeTodo(todo.id);
   };

   return (
      <li
         class={('todo' + (todo.completed ? ' completed' : ''))}
         style={{ opacity: ($isRemoving() ? 0.3 : 1) }}
      >
         <div class="view">
            <input
               class="toggle"
               type="checkbox"
               checked={(todo.completed)}
               on:change={e => toggleCompleted(todo, e.target.checked)}
            />
            {If((toggleCompleted.error),
               <div>failed.
                  <span on:click={e => toggleCompleted.retry()}>retry?</span>
                  <span on:click={e => toggleCompleted.rollback()}>retry?</span>
               </div>
            )}
            <label>{todo.title}</label>
            <button class="destroy" on:click={reRemoveBtnClick} />
         </div>
      </li>
   );
}


export type Todo = {
   id: string;
   title: string;
   completed: boolean;
};

export const db = {
   getTodos() {
      return delay(getTodos(), 400);
   },
   async addTodo(todo: Todo) {
      let todos = [...getTodos(), todo];
      await saveTodos(todos);
      return todos[todos.length - 1];
   },
   async removeTodo(todoId: string) {
      return saveTodos(getTodos().filter((t) => t.id !== todoId));
   },
   async toggleTodo(todoId: string, completed: boolean) {
      let found;
      await saveTodos(
         getTodos().map((t) => {
            if (t.id !== todoId) return t;
            return (found = { ...t, completed });
         })
      );
      return found;
   },
};

function delay<T>(payload: T, time: number) {
   return new Promise<T>((res) => setTimeout(res, time, payload));
}

function getTodos(): Todo[] {
   return JSON.parse(localStorage.getItem('TODOS') || '[]');
}
function saveTodos(todos: Todo[]) {
   localStorage.setItem('TODOS', JSON.stringify(todos));
   return delay(undefined, 400);
}
