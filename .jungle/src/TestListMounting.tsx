import { component, template, Else, ElseIf, For, If } from "@rue/luent";
import { $activeUpdate, ionic, ion, Ionic, PRELUDE, atRender, queueTask, watch } from "@rue/quarky";

export function TestListMounting() {
   let count = 0
   const $active = ion(true, {
      toggle() {
         this.value = !this.value
      }
   })

   const logs = ionic([] as string[])

   const log = (msg: string) => { logs.push(msg); console.log('logs', [...logs]) }

   function getEach(logs: any[]) {
      const clone = []
      console.log("clone =============")
      for (let i = 0; i < logs.length; i++) {
         clone[i] = logs[i]
      }
      console.log("clone end=============")
      return clone
   }

   return component(
      <div>
         <button on:click={e => $active.toggle()}>switch</button>
         {If($active,
            <Counter log={log}></Counter>
         )}
         {ElseIf((!$active()), 'remount',
            <Counter log={log}></Counter>
         )}
         <aside style="position: fixed; width: 500px; height: 1000px; background-color: #eee">
            LOGS:
            <button on:click={e => { logs.push({ msg: 'hi' + count++ }); logs.push({ msg: 'bye' + count++ });console.log('logs', getEach(logs)) }}>click</button>
            {/* <button on:click={e => logs.push('hi' + count++)}>click</button> */}
            <ul>
               {For(logs, m => m, log =>
                  <span style="font-size: x-small">
                     - {log.msg}<br />
                  </span>
               )}
            </ul>
         </aside>
      </div>
   )
}

function Counter(input: { log?: (msg: string) => void }) {
   let count = 0
   const { log } = input
   return component(
      <div
         pre:detach={e => {
            log?.({ msg: 'bye' + count++ })
            log?.('bye' + count++)
         }}
         pre:attach={e => {
            log?.({ msg: 'hiya' + count++ })
            // log?.('hiya' + count++)
         }}
      >bye</div>
   )
}

// export function TestUpdateAfterCommitted() {
//    const $count = ion(0)
//    const $countB = ion('B0')

//    watch($count, () => {
//       atRender(() => {
//          $countB.value = 'B' + $count()
//          console.log('$$$', $countB())
//          // queueTask(() => console.log('$$$', $countB()))
//       })
//    }, { phase: PRELUDE })

//    return template(
//       <>
//          {/* <div>{$count}</div> */}
//          <div>{$countB}</div>
//          <button on:click={e => $count.value++}>click</button>
//       </>
//    )
// }