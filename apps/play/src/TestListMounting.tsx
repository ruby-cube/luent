import { component, Else, ElseIf, For, FromTag, If } from "@rue/lumo";
import { $activeUpdate, Ion, Ionic, PRELUDE, queueRender, queueTask, watch } from "@rue/quarky";

export function TestListMounting() {
   let count = 0
   const $active = Ion(true, {
      toggle() {
         this.value = !this.value
      }
   })

   const logs = Ionic([] as string[])

   const log = (msg: string) => logs.push(msg)

   return component(
      <div>
         <button on:click={e => $active.toggle()}>switch</button>
         {If($active,
            // <div
            //    at:unmount={e => {
            //       log('bye' + count++)
            //    }}
            //    at:mount={e => {
            //       log('hiya' + count++)
            //    }}
            // >bye</div>
            <Counter can:log={msg => logs.push(msg)}></Counter>
         )}
         {ElseIf((!$active()), 'mount',
            // <div
            //    at:unmount={e => {
            //       log('bye' + count++)
            //    }}
            //    at:mount={e => {
            //       log('hiya' + count++)
            //    }}
            // >bye</div>
            <Counter can:log={msg => logs.push(msg)}></Counter>
         )}
         <aside style="position: fixed; width: 500px; height: 1000px; background-color: #eee">
            LOGS:
            <button on:click={e => logs.push('hi' + count++)}>click</button>
            <ul>
               {For(logs, log =>
                  <span style="font-size: x-small">
                     - {log.msg}<br />
                  </span>
               )}
            </ul>
         </aside>
      </div>
   )
}

function Counter(input: FromTag<{ 'can:log': (msg: string) => void }>) {
   let count = 0
   const { log } = input
   return component(
      <div
         at:unmount={e => {
            log({msg: 'bye' + count++})
         }}
         at:mount={e => {
            log({msg: 'hiya' + count++})
         }}
      >bye</div>
   )
}

// export function TestUpdateAfterCommitted() {
//    const $count = Ion(0)
//    const $countB = Ion('B0')

//    watch($count, () => {
//       queueRender(() => {
//          $countB.value = 'B' + $count()
//          console.log('$$$', $countB())
//          // queueTask(() => console.log('$$$', $countB()))
//       })
//    }, { phase: PRELUDE })

//    return component(
//       <>
//          {/* <div>{$count}</div> */}
//          <div>{$countB}</div>
//          <button on:click={e => $count.value++}>click</button>
//       </>
//    )
// }