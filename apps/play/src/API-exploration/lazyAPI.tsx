//@ts-nocheck
// You're filtering a large list based on a search input.

import { AsyncIon, template, For, fromGround, provideGround } from "@rue/luent";
import { Ion,queueIonicTask } from "@rue/quarky";
import { Await, Meanwhile } from "../../../../packages/luent/src/boundaries/Await";

// tsx
// Copy
// Edit
// const [input, setInput] = useState('');
// const [query, setQuery] = useState('');
// const [isPending, startTransition] = useTransition();

// const handleChange = (e) => {
//   setInput(e.target.value);
//   startTransition(() => {
//     setQuery(e.target.value); // Triggers expensive filtering
//   });
// };

function fetchItems($searchTerm: Ion<string>, options: SuspenseOptions) {
   return AsyncIon(() => fetch(`/${$searchTerm}`), options)
}

provideFetch(fetchItems, ($searchTerm: Ion<string>) =>
   () => fetch(`/${$searchTerm}`)
)

const fetchItems = useFetch(
   function fetchItems($searchTerm: Ion<string>) {
      return () => fetch(`/${$searchTerm}`)
   }
)

provideGlobalFunction(fetchSomething, () => {

})

const fetchSomething = useGlobalFunction()



type AsyncIon<T> = {
   state: T,
   promise: Promise<T>,
   error: Error | null,
   $loading: Ion<boolean>,
   $updating: Ion<boolean>,
   cancelUpdate: void,
   placeholder?: T
}

function App() {
   const $searchTerm = ion.debounced('', 100)

   const $items = fetchItems($searchTerm, { awaited: true })

   return template(
      <>
         <input mu:value={$searchTerm} />
         <button on:click={e => $items.cancelUpdate()}>cancel</button>
         {Await($items,
            <>
               {For($items, (item) => (
                  <Item item={item}></Item>
               ))}
               {If($items.$updating, (
                  <>filtering...</>
               ))}
            </>
         )}
         {Meanwhile(
            For($items.placeholder, (item) => (
               <Item item={item}></Item>
            ))
         )}
      </>
   )
}


function fetchItems($searchTerm: Ion<string>, options: SuspenseOptions) {
   return ion.suspense(() => fetch(`/${$searchTerm}`), options)
}

type AsyncIon<T> = {
   state: T,
   promise: Promise<T>,
   error: Error | null,
   $loading: Ion<boolean>,
   $updating: Ion<boolean>,
   cancelUpdate: void,
   placeholder?: T
}



function App() {
   const $searchTerm = ion.debounced('', 100)

   const $items = Ion(largeList)

   const lazyBatch = useLazyBatch()

   const $filteredList = ion.suspense(async () => {
      const list = $items();
      const searchTerm = $searchTerm()
      const filteredList = []
      for (const item of list) {
         lazyBatch(() => { if (hasSearchTerm(item, searchTerm)) filteredList.push(item) })
      }
      await lazyBatch();
      return filteredList;
   })
   const $filteredList = ion.suspense(async () => await lazyMapping($items(), item => hasSearchTerm(item, $searchTerm()) ? item : undefined))

   return template(
      <>
         <input mu:value={$searchTerm} />
         <button on:click={e => $items.cancelUpdate()}>cancel</button>
         {For($filteredList, (item) => (
            <Item item={item}></Item>
         ))}
         {If($items.$updating, (
            <>filtering...</>
         ))}
      </>
   )
}