//@ts-nocheck
export function TestCounterModel() {

   const counter = ionize({
      count: 0
   }, {
      increment() {
         counter.count++
      },
      decrement() {
         counter.count--
      }
   })

   return component(
      <>
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         <swap:mount />
         {$if($active)} {
            <>
               <List></List>
               <p>hello</p>
            </>
         }
         {$elseif($broken)} {
            <div>do something</div>
         }
         {Else} {
            <div>bleh</div>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$for(list, (item, $index) =>
            <p>hello {$index()}</p>
         )}
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {Match(key)}:
         {Case('hello')} {
            <p>hello world</p>
         }
         {Case('bye')} {
            <p>hello world</p>
         }
         {Default('hello')} {
            <p>hello world</p>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$if($active)} hello
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$if($active)} {
            <>hello</>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>

         <swap:mount />
         {$if($active)} {
            <p>hello {$userName}</p>
         }
         {$elseif($broken)} {
            <div>do something</div>
         }
         {$else} {
            <div>bleh</div>
         }
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$for(list, (item, $index) =>
            <p>hello {$index()}</p>
         )}
         <div>{counter.$count}</div>
         <button on:click={counter.increment}>increment</button>
         <button on:click={counter.decrement}>decrement</button>
         {$match(key)}:
         {$case('hello')} {
            <p>hello world</p>
         }
         {$case('bye')} {
            <p>hello world</p>
         }
         {$default} {
            <p>hello world</p>
         }
         {$if($active)} hello
         <div>{counter.$count}</div>

      </>
   )
}
