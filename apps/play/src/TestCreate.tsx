import { template } from "@rue/lumo";
import { Ion } from "@rue/quarky";


export function TestCreate() {
   const tabs = {
      1: { content: 'hi' },
      2: { content: 'welcome' },
      3: { content: 'bye' },
   }

   const $activeTab = Ion(tabs[1])

   return template(
      <div>

         <button on:click={e => $activeTab.value = tabs[1]}>1</button>
         <button on:click={e => $activeTab.value = tabs[2]}>2</button>
         <button on:click={e => $activeTab.value = tabs[3]}>3</button>
         <Tab content={($activeTab().content)}></Tab>
      </div>
   )
}

function Tab({ $content }) {
   const $count = Ion(0)

   return template(
      <div>
         <button on:click={e => $count.value++}>+</button>
         <button on:click={e => $count.value--}>-</button>
         <p>{$count}</p>
         <div>{$content}</div>
      </div>
   )
}