//@ts-nocheck

export function TodoList({ todos, addTodo }: Props) {



   <>
      <div class="container">
         <h2>{'Todo List'}</h2>
         <ul>
            for (const todo of todos) {
               let isActive = false;

            <li>{todo.text}</li>
            }
         </ul>
         if ((todos.length > 0)) {
            let $count = Ion(0);
            let $doubled = Ion(() =>$count * 2);
         <>
            <p>{todos.length} {"items"}</p>
            <p>{$count}</p>
            <p>{$doubleCount}</p>
         </>
         }
         <Button onClick={addTodo} label={"Add Todo"} />
      </div>

      <style>
         .container {
            text - align: center;
         font-family: "Arial", sans-serif;
         }
      </style>
   </>

   return { something }
}

export function TodoList({ todos, addTodo }: Props) {

   const todos = ionize([], { key: 'id' });

   <>
      <div class="container">
         <h2>{'Todo List'}</h2>
         <ul>
            {For(todos, (todo) => (
               isActive = false
            ) =>
               <li>{todo.text}</li>
            )}
         </ul>

         <remount-demount />
         {If((todos.length > 0), (
            $count = Ion(0),
            $doubled = Ion(() =>$count * 2),
            _1 = console.log('hi'),
            _2 = console.log('hi'),
         ) =>
            <>
               <p>{todos.length} {"items"}</p>
               <p>{$count}</p>
               <p>{$doubleCount}</p>
            </>
         )}

         <Button onClick={addTodo} label={"Add Todo"} />
      </div>

      <style>
         .container {
            text - align: center;
         font-family: "Arial", sans-serif;
         }
      </style>
   </>
}


export function TodoList({ todos, addTodo }: Props) {



   <>
      <div class="container">
         <h2>{'Todo List'}</h2>
         <ul>
            {For(todos, (todo) => {
               let isActive = false;

               <li>{todo.text}</li>
            })}
         </ul>

         <remount-demount />
         {If($active, v => {
            const $count = Ion(0);
            const $doubled = Ion(() =>$count * 2);
            console.log('hi');

            <>
               <p>{todos.length} {"items"}</p>
               <p>{$count}</p>
               <p>{$doubleCount}</p>
            </>
         })}

         <Button onClick={addTodo} label={"Add Todo"} />
      </div>

      <style>
         .container {
            text - align: center;
         font-family: "Arial", sans-serif;
         }
      </style>
   </>
}

export function Counter() {
   let $count = 0;
   let $doubled = $count * 2;

   <div class='counter'>
      <h2>{'Counter'}</h2>
      <p>{`Count: ${$count}`}</p>
      <p>{`Doubled: ${$doubled}`}</p>

      <Button onClick={() => $count++} label={'Increment'} />
      <Button onClick={() => $count = 0} label={'Reset'} />
   </div>
}