import { Ion, MutableIon , πø, ø} from "@rue/quarky";
import { FromTag, If, template } from "@rue/lumo";

// TODO: formatter adds tab between get keyword and variable
// function FractionKit(øcount: Ion<number>) {

//       return {
//          get halfCount: Ion(() => count / 2),
//          get thirdCount: Ion(() => count / 3)
//       }
// }


function FractionKit(øcount: Ion<number>) {

   return {
      øhalfCount: Ion(() => øcount() / 2),
      øthirdCount: Ion(() => øcount() / 3)
   }
}

export function QrxCounter({ øshowFractions }: FromTag<{ showFractions: MutableIon<boolean> }>) {

   const øcount = Ion(0, {
      increment() {
         øcount.value++
      }
   })
   const ødoubleCount = Ion(() => øcount() * 2)

   const kit = FractionKit(øcount);
   const øhalfCount = (kit.øhalfCount, πø(kit, 'øhalfCount'))
   const øthirdCount = (kit.øthirdCount, πø(kit, 'øthirdCount'))

   function doSomething(count: number) {
      console.log('count', count)
   }

   doSomething(øcount())

   function other(count: number) {
      console.log('counter',
         //@ts-expect-error
         cout
      )
   }

   let dog;

   const øobj = Ion({ name: 'kermit' } as { name: string } | undefined)

   function doSomethingElse() {
      if (dog) {

      }
      else if (øobj()) {
         const name = øobj()?.name
         console.log('name', øobj()!, name)
      }
      else {
         øobj()?.name
         console.log('nothing')
      }
   }

   doSomethingElse()

   return template(
      <div>
         <button on:click={e => øcount.increment()}>+</button>
         <p>start: {øcount()}</p>
         <p>count: {øcount}</p>
         <p>doubleCount: {ødoubleCount}</p>
         <p>tripleCount: {ø(() => øcount() * 3)}</p>
         <button on:click={e => { øshowFractions.value = !øshowFractions(); øshowFractions() ? øobj.value = undefined : øobj.value = { name: 'sir robin' } }}>{ø(() => øshowFractions() ? 'hide' : 'show')} fractions</button>
         {/* {If(obj,
            <div>{obj.name}</div>
         )}
         {If(obj,
            <div>{(obj.name)}</div>
         )}
         {If(obj, () =>
            <div>{obj.name}</div>
         )}
         {If(øobj,
            <div>{obj.name}</div>
         )}
         {If(øobj,
            <div>{(obj.name)}</div>
         )}
         {If(øobj, () =>
            <div>{obj.name}</div>
         )} */}
         {If(øshowFractions, <>
            <hr></hr>
            <p> halfCount: {øhalfCount}</p>
            <p> thirdCount: {øthirdCount}</p>
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
  const ønewTodo = Ion("");

  // Reactive object for filter state
  const filter = Ionic({ value: "all" });

  // Derivation ions for filtered todos
  const øactiveTodos = Ion(() => todos.filter((todo: Todo) => !todo.completed));
  const øcompletedTodos = Ion(() => todos.filter((todo: Todo) => todo.completed));

  function addTodo() {
    if (ønewTodo()?.trim()) {
      todos.push(TodoItem(ønewTodo()!));
      ønewTodo.value = "";
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
    if (filter.value === "active") return øactiveTodos;
    if (filter.value === "completed") return øcompletedTodos;
    return todos;
  }

  return template(
    <div>
      <h2>RealWorld Todo Demo (.qrx)</h2>
      <input
        value={ønewTodo}
        on:input={e => ønewTodo.value = e.target.value}
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
        <span>{øactiveTodos.length} left</span>
        <span> / {todos@.length} total</span>
      </div>
    </div>
  );
}