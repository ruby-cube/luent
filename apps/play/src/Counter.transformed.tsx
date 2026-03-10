import { Ion, MutableIon , πæ, æ} from "@rue/quarky";
import { FromTag, If, template } from "@rue/lumo";

// TODO: formatter adds tab between get keyword and variable
// function FractionKit(æcount: Ion<number>) {

//       return {
//          get halfCount: Ion(() => count / 2),
//          get thirdCount: Ion(() => count / 3)
//       }
// }


function FractionKit(æcount: Ion<number>) {

   return {
      æhalfCount: Ion(() => æcount() / 2),
      æthirdCount: Ion(() => æcount() / 3)
   }
}

export function QrxCounter({ æshowFractions }: FromTag<{ showFractions: MutableIon<boolean> }>) {

   const æcount = Ion(0, {
      increment() {
         æcount.value++
      }
   })
   const ædoubleCount = Ion(() => æcount() * 2)

   const kit = FractionKit(æcount);
   const æhalfCount = (kit.æhalfCount, πæ(kit, 'æhalfCount'))
   const æthirdCount = (kit.æthirdCount, πæ(kit, 'æthirdCount'))

   function doSomething(count: number) {
      console.log('count', count)
   }

   doSomething(æcount())

   function other(count: number) {
      console.log('counter',
         //@ts-expect-error
         cout
      )
   }

   let dog;

   const æobj = Ion({ name: 'kermit' } as { name: string } | undefined)

   function doSomethingElse() {
      if (dog) {

      }
      else if (æobj()) {
         const name = æobj()?.name
         console.log('name', æobj()!, name)
      }
      else {
         æobj()?.name
         console.log('nothing')
      }
   }

   doSomethingElse()

   return template(
      <div>
         <button on:click={e => æcount.increment()}>+</button>
         <p>start: {æcount()}</p>
         <p>count: {æcount}</p>
         <p>doubleCount: {ædoubleCount}</p>
         <p>tripleCount: {æ(() => æcount() * 3)}</p>
         <button on:click={e => { æshowFractions.value = !æshowFractions(); æshowFractions() ? æobj.value = undefined : æobj.value = { name: 'sir robin' } }}>{æ(() => æshowFractions() ? 'hide' : 'show')} fractions</button>
         {/* {If(obj,
            <div>{obj.name}</div>
         )}
         {If(obj,
            <div>{(obj.name)}</div>
         )}
         {If(obj, () =>
            <div>{obj.name}</div>
         )}
         {If(æobj,
            <div>{obj.name}</div>
         )}
         {If(æobj,
            <div>{(obj.name)}</div>
         )}
         {If(æobj, () =>
            <div>{obj.name}</div>
         )} */}
         {If(æshowFractions, <>
            <hr></hr>
            <p> halfCount: {æhalfCount}</p>
            <p> thirdCount: {æthirdCount}</p>
         </>)}
      </div >
   )
}


export function TodoApp() {

   return template(
      <div></div>
   )
}



type Todo = { title: string; completed: boolean };

function TodoItem(title: string): Todo {
  return { title, completed: false };
}

export function RealWorldDemo() {
  // Reactive array of todos
  const todos = Ionic([
    TodoItem("Learn Rue"),
    TodoItem("Build a demo"),
  ]);

  // Atomic ion for new todo input
  const ænewTodo = Ion("");

  // Reactive object for filter state
  const filter = Ionic({ value: "all" });

  // Derivation ions for filtered todos
  const æactiveTodos = Ion(() => todos.filter((todo: Todo) => !todo.completed));
  const æcompletedTodos = Ion(() => todos.filter((todo: Todo) => todo.completed));

  function addTodo() {
    if (ænewTodo()?.trim()) {
      todos.push(TodoItem(ænewTodo()!));
      ænewTodo.value = "";
    }
  }

  function toggle(todo: Todo) {
    todo.completed = !todo.completed;
  }

  function remove(todo: Todo) {
    const idx = todos.indexOf(todo);
    if (idx !== -1) todos.splice(idx, 1);
  }

  function filteredTodos() {
    if (filter.value === "active") return æactiveTodos;
    if (filter.value === "completed") return æcompletedTodos;
    return todos;
  }

  return template(
    <div>
      <h2>RealWorld Todo Demo (.qrx)</h2>
      <input
        value={ænewTodo}
        on:input={e => ænewTodo.value = e.target.value}
        placeholder="Add a todo..."
      />
      <button on:click={addTodo}>Add</button>
      <div>
        <button on:click={() => (filter@.value = "all")}>All</button>
        <button on:click={() => (filter@.value = "active")}>Active</button>
        <button on:click={() => (filter@.value = "completed")}>Completed</button>
      </div>
      <ul>
        {filteredTodos().map((todo: Todo) => (
          <li>
            <input type="checkbox" checked={todo.completed} on:change={() => toggle(todo)} />
            <span style={{ textDecoration: todo.completed ? "line-through" : "none" }}>{todo.title}</span>
            <button on:click={() => remove(todo)}>x</button>
          </li>
        ))}
      </ul>
      <div>
        <span>{æactiveTodos.length} left</span>
        <span> / {todos@.length} total</span>
      </div>
    </div>
  );
}