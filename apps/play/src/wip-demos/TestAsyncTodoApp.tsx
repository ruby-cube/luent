// @ts-nocheck
import { FromTag, AsyncIon, If, Suspense } from "@rue/lumo";
import { Await, Meanwhile } from "../../../../packages/lumo/src/boundaries/Await";
import { EACH, instantUpdate, Ion, Ionic, IonicProxy, isIonicProxy } from "@rue/quarky";
import { Action, REFETCH } from "../../../../packages/quarky/src/async/Action";
import { toggleCompleted } from "./AsyncDemoLessons/data";
import { AnyObject } from "@rue/types";
import { isObject } from "@rue/utils";




const ENTER_KEY = 13;

const generateId = () => Date.now().toString(36);

// const IonicTodo = (data) => asNestedAsync(data, data.id, data => Ionic(new Todo(data)), {
//    refetch: () => db.getTodo(data.id),
//    update(todo, data) { // custom updater
//       return updateProperties(todo, {
//          completed: data.completed,
//          _likeCount: data.likeCount,
//          obj: isPlainObject(data.obj) ? update(todo.obj, data.obj) : data.obj
//       })
//    }
// })


const asIonicTodo = AsNestedAsync(data => [data.id, Ionic(new Todo(data)), {
   refetch: () => db.getTodo(data.id),
   update(todo, data) { // custom updater
      return updateProperties(todo, {
         completed: data.completed,
         _likeCount: data.likeCount,
         obj: isPlainObject(data.obj) ? update(todo.obj, data.obj) : data.obj
      })
   }
}])


function AsyncModel<D extends AnyObject>(initialData: D, fetch: () => D, config: ModelMethods & { as?: (data: AnyObject) => AnyObject }) {
   const { as: transform = data => data, refetch } = config
   const model = transform(initialData)
   const update = config.update ?? chooseUpdater(model)

   watch(fetch, ({ current: promise }) => {
      promise.then(data => {

         instantUpdate(() => {
            update(model, data)
         })
      })
   }, { phase: PRELUDE, eager: true })

   return model
}




const todos = Ionic([], {
   '-fetch': () => db.getTodos($id()),
   [EACH]: {
      as: data => Ionic(data, {
         '-refetch': () => db.getTodo(data.id)
      })
   }
})

const todos = Ionic([], {
   '-fetch': () => db.getTodos($id()),
   [EACH]: { as: IonicTodo },
})

function IonicTodo(data: AnyObject) {
   return Ionic(data, {
      '-refetch': () => db.getTodo(data.id)
   })
}




const AS_ASYNC_MODEL = Symbol('asAsyncModel')

class AsyncModel {
   pods?: AnyObject[]
   pendingFetch?: Promise<any> | null = null
   pendingDispatches?: Promise<any>[]
}

function updateProperties(model: AnyObject, data: AnyObject) {
   const keys = Object.keys(data)

   for (const key of keys) {
      model[key] = data[key]
   }
   return model
}

function updateArray(model: any[], data: any[]) {
   const length = data.length
   while (model.length > length) {
      delete model[model.length - 1]
   }

   const nestedConfig = getNestedConfig(model)
   const eachAsModel = nestedConfig?.[EACH]

   if (eachAsModel) {
      for (i = 0; i < length; i++) {
         const value = data[i]
         if (isObject(value)) {
            model[i] = eachAsModel(value)
         }
         else if (value !== model[i]) {
            model[i] = value
         }
      }
   }
   else {
      for (i = 0; i < length; i++) {
         model[i] = value
      }
   }
}

class IonicDepot {
   entries = new Map<string | number, AnyObject>() // TODO: memory leak? 

   get(uid: string | number, data: AnyObject) {
      const model = this.entries.get(uid)
      if (!model) return;
      if ('update' in model) {
         model.update(data)
      }
      else {
         if (__DEV__) throw new Error('model must have update method')
      }
      return model
   }

   create(uid: string | number, data: AnyObject, create: (data: AnyObject) => AnyObject) {
      const model = create(data)
      this.entries.set(uid, model)
      return model
   }

   destroy(uid: string | number) {
      this.entries.delete(uid)
   }
}

const depot = new IonicDepot()

type ModelMethods = { refetch?: () => D, update?: (data: D) => T }

function asNestedAsync<T extends AnyObject, M extends ModelMethods>(data: T, uid: string | number, create: (data: T) => M) {
   return depot.get(uid, data) ?? depot.create(uid, data, create)
}


const IonicTodos = todos => Ionic(todos, { [EACH]: IonicTodo })

function refetch() { return REFETCH }

// TODO:
// [] Race
// [] Optimistic
// [] retry
// [] realtime races

// TODO: races with other AsyncIons and AsyncActions
// nested: todo within todos
// identical: set todos or set all properties
// partial overlap: set some properties, some may overlap

export default function TodoApp() {

   const $todos = AsyncIon([], () => db.fetchTodos(), { to: IonicTodos })

   const addTodo = Action((todo: Todo) => (ooo
      .await(db.addTodo(todo),
         refetch
      )
   ), $todos)

   const removeTodo = Action((todoID: string) => (ooo
      .await(db.removeTodo(todoID),
         refetch
      )
   ), $todos)

   // // one-way overlap
   // definePartialRace($todos, [
   //    ToggleCompleted,
   //    SetHighlighted
   // ])


   // // two-way overlap
   // definePartialRace(
   //    toggleCompleted, // This should be in Todo component
   //    setHighlighted
   // )

   // // complete overlap
   // defineRace($todos, $sameTodos)


   // function AsyncTodoKit(todo: Todo) {
   //    const $todos = fromContext($TODOS)


   //    return {
   //       toggleCompleted,
   //       setHighlighted
   //    }
   // }

   return (
      <section class="todoapp">
         <header class="header">
            <h1>todos</h1>
         </header>
         <TodoInput addTodo={addTodo} />
         {Await($todos,
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

   const reRemoveBtnClick = () => {
      $isRemoving.value = true;
      removeTodo(todo.id);
   };

   const toggleCompleted = Action((completed: boolean) => {
      storeRollback({
         completed: todo.completed,
         modifiedDate: todo.modifiedDate
      }, prev => {
         todo.completed = prev.completed
         todo.modifiedDate = prev.modifiedDate
      })

      todo.completed = completed;
      todo.modifiedDate = Date.now()

      return oo.await(db.toggleTodo(todo.id, completed), () => {
         todo.refetch()
      })
   })

   // FIX: avoid having to pass down a reference to $todos, can we auto-establish race via For() ?
   // one-way overlap
   // definePartialRace($todos, [
   //    toggleCompleted,
   //    setHighlighted
   // ])

   // definePartialRace(
   //    toggleCompleted,
   //    setHighlighted
   // )

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
