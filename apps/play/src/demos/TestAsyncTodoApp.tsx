// @ts-nocheck
import { FromTag, AsyncIon } from "@rue/lumo";
import { Meanwhile } from "../../../../packages/lumo/src/boundaries/Await";
import { Ionic } from "@rue/quarky";
const AsyncIon = AsyncIon


const ENTER_KEY = 13;

const generateId = () => Date.now().toString(36);

const IonicTodo = todo => {
   return depot.get(todo.id) ?? depot.create(() => Ionic(todo, {
      $completed: AsyncIon(todo.completed, { // TODO: finish implementing
         fetch: () => {
            const { completed } = await db.toggleTodo(todo.id, completed)
            return completed;
         }
      })
   }))
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

   const toggleCompleted = AsyncAction((todo: Todo, index: number, completed: boolean) => {
      oo.await(db.toggleTodo(todo.id, completed), ({ completed }) => (
         todo.completed = completed
      ));
   })


   return (
      <section class="todoapp">
         <header class="header">
            <h1>todos</h1>
         </header>
         <TodoInput addTodo={addTodo} />
         {Await($todos.loaded, // TODO: first load vs refetches
            <div>
               <TodoList
                  todos={$todos}
                  removeTodo={removeTodo}
                  toggleCompleted={toggleCompleted}
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
   toggleCompleted: () => (id: string, completed: boolean) => Promise<void>;
   removeTodo: (id: string) => Promise<void>;
}>) {
   const { $todos, toggleCompleted, removeTodo } = input

   return (
      <section class="main">
         <ul class="todo-list">
            {For($todos, (todo) => (
               <Todo
                  key={todo.id}
                  todo={todo}
                  toggleCompleted={toggleCompleted}
                  removeTodo={removeTodo}
               />
            ))}
         </ul>
      </section>
   );
}

function Todo({
   todo,
   toggleCompleted,
   removeTodo,
}: FromTag<{
   todo: Todo;
   toggleCompleted: (id: string, completed: boolean) => Promise<void>;
   removeTodo: (id: string) => Promise<void>;
}>) {
   const $isRemoving = Ion(false);

   const reCheckboxChange = ({ target: { checked } }) => {
      todo.completed = checked; // optimistic update
      toggleCompleted.dispatch(todo.id, checked);
   };

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
               on:change={reCheckboxChange}
            />
            {If((toggleCompleted.error),
               <div>failed. <span on:click={e => toggleCompleted.retry()}>retry?</span></div>
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
