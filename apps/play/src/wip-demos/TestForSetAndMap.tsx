import { component, For, target } from "@rue/lumo";
import { Ion, Ionic } from "@rue/quarky";

let num = 0


export function TestForSetAndMap() {

   const set = Ionic(new Set(), {
      addNumber() {
         this.add(num++)
      }
   })

   const map = Ionic(new Map(), {
      setPair() {
         this.set(num++, 'B' + num)
      }
   })

   return component(
      <div>
         <button on:click={e => map.setPair()}>+</button>
         {For(map, ([$key, $value], i) =>
            <p on:click={e => !target('span') && map.delete($key())}>
               ({i}) {$key} - <span on:click={e => { console.log('clicked'); map.set($key(), "A" + $value()) }}>{$value}</span>
            </p>
         )}
         <hr></hr>
         <button on:click={e => set.addNumber()}>+</button>
         {For(set, ($num, i) =>
            <p on:click={e => set.delete($num())}>({i}) {$num}</p>
         )}
      </div>
   )
}

export function TestForSetAndMapIons() {

   const $set = Ion(Ionic(new Set()), {
      addNumber() {
         this.value.add(num++)
      },
      delete(num: number) {
         this.value.delete(num)
      }
   })

   const $map = Ion(Ionic(new Map()), {
      setPair() {
         this.value.set(num++, 'B' + num)
      },
      delete(key: any) {
         this.value.delete(key)
      },
      set(key: any, value: any) {
         this.value.set(key, value)
      }
   })

   return component(
      <div>
         <button on:click={e => $map.setPair()}>+</button>
         {For($map, ([$key, $value], i) =>
            <p on:click={e => !target('span') && $map.delete($key())}>
               ({i}) {$key} - <span on:click={e => { console.log('clicked'); $map.set($key(), "A" + $value()) }}>{$value}</span>
            </p>
         )}
         <hr></hr>
         <button on:click={e => $set.addNumber()}>+</button>
         {For($set, ($num, i) =>
            <p on:click={e => $set.delete($num())}>({i}) {$num}</p>
         )}
      </div>
   )
}
