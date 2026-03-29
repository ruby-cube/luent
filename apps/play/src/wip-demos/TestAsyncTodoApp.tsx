// @ts-nocheck
import { FromTag, AsyncIon, If, Suspense } from "@rue/lumo";
import { Await, Meanwhile } from "../../../../packages/lumo/src/boundaries/Await";
import { EACH, instantUpdate, Ion, Ionic, IonicProxy, isIonicProxy } from "@rue/quarky";
import { Action, REFETCH } from "../../../../packages/quarky/src/async/Action";
import { toggleCompleted } from "./AsyncDemoLessons/data";
import { AnyObject } from "@rue/types";
import { isObject, noop } from "@rue/utils";




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





const AS_ASYNC_MODEL = Symbol('asAsyncModel')


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






// TODO:
// [] Race
// [] Optimistic
// [] retry
// [] realtime races

// TODO: races with other AsyncIons and AsyncActions
// nested: todo within todos
// identical: set todos or set all properties
// partial overlap: set some properties, some may overlap

function IonicTodos(data: Todo[]) {
   return Ionic(data, {
      [EACH]: IonicTodo,
      '-patch': patchIonicArray
   })
}

function patchIonicArray(data) {
   // // lost-and-found
   // const map: Map<string, { item?: AnyObject, dataItem?: AnyObject }> = new Map()
   // const indices: number[] = []

   const length = data.length > this.length ? data.length : this.length

   for (let i = 0; i < length; i++) {
      const item = this[i]
      const dataItem = data[i]
      const id = getID(item)
      const dataID = getID(data)
      if (id) {
         if (id === dataID) {
            item.update(dataItem)
         }
         else {
            array[i] = this[EACH](dataItem) // TODO: standin code

            // indices.push(i)
            // const itemPair = map.get(id)
            // const dataPair = map.get(dataID)

            // if (itemPair) itemPair.item = item
            // else map.set(id, { item, dataItem: undefined })

            // if (dataPair) dataPair.data = dataItem
            // else map.set(dataID, { dataItem, item: undefined })
         }
      }
      else {
         item.update(dataItem)
      }
   }

   // for (const i of indices) {
   //    const { item, dataItem } = map.get(getID(data[i]))
   //    if (item && dataItem) {
   //       this[i] = item.patch(dataItem)
   //    }
   //    else if (dataItem) {
   //       // new item
   //       this[i] = this[EACH](dataItem) // TODO: standin code
   //    }
   // }

   if (this.length > data.length) {
      // remove items
      this.splice(data.length)
   }
   return this
}


function IonicTodo(data: AnyObject) {
   return Ionic(data, {
      '-wrap': data => new Todo(data),
      '-getID': n => n.id,
      '-refetch': () => db.getTodo(data.id),
      '-patch': patchObject,
      profile: { '-as': IonicProfile },
   })
}

// depot.get(data.id).patch(data)

function patchObject(data: AnyObject | null | undefined) {
   if (!data) return data;
   const keys = Object.getOwnPropertyNames(this)
   for (const key of keys) {
      const value = this[key]
      const as = this[AS] // TODO: standin code
      if (as) {
         this[key] = this.patchNested(this[key], data[key], as)
      }
      else {
         this[key] = data[key]
      }
   }
}

function patchNested(this: AnyObject, obj: AnyObject | undefined, data: AnyObject | undefined, as: (data: AnyObject) => AnyObject) {
   if (obj && data) {
      const id = getID(obj)
      const dataID = getID(data)
      if (id && id === dataID || !id) {
         return obj.patch(data)
      }
   }
   if (data) {
      return as(data)
   }
   return data;
}

function IonicTodosIon() {
   return Ion([], {
      '-as': IonicTodos,
      '-fetch': () => db.fetchTodos(),
      '-patch': patchDeepIon,
   })
}

function patchDeepIon(data: any) {
   if (!data) return this.value = data;

   const value = this.value;
   const id = getID(value);
   const dataID = getID(data)
   if (id) {

   }
      return this.value = this.value.patch(data)
}

export default function TodoApp() {

   const $todos = IonicTodosIon()

   // const addTodo = Action((todo: Todo) => (ooo
   //    .await(db.addTodo(todo),
   //       refetch
   //    )
   // ), $todos)

   const addTodo = Action(async ($todos: Ionic<IonicTodos>, todo: Todo) => {
      $todos.unfetch()

      await db.addTodo(todo)
      return $todos.refetch()
   }, {
      catch(error) {

      }
   })

   // const addTodo = Action((todo: Todo) => {
   //    async {
   //       await db.addTodo(todo) ...:
   //          refetch();
   //          return;
   //    }
   // }, $todos)

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

   const toggleCompleted = Action(async (todo: IonicTodo, completed: boolean) => {
      todo.unfetch()

      todo.completed = completed;
      todo.modifiedDate = Date.now()

      return await db.toggleTodo(todo.id, completed)
   }, {
      '@success'(updatedTodo) {
         todo.completed = updatedTodo.completed
         todo.modifiedDate = updatedTodo.modifiedDate
      },
      '-optimistic': true
   })

   const toggleCompleted = Action((todo: IonicTodo, completed: boolean) => {
      // storeRollback({ // TODO: can this be done under the hood?
      //    completed: todo.completed,
      //    modifiedDate: todo.modifiedDate
      // }, prev => {
      //    todo.completed = prev.completed
      //    todo.modifiedDate = prev.modifiedDate
      // })

      todo.completed = completed;
      todo.modifiedDate = Date.now()

      async {
         await db.toggleTodo(todo.id, completed) ...updatedTodo:
      todo.completed = updatedTodo.completed
            todo.modifiedDate = updatedTodo.modifiedDate
      }
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
