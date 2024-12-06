import { Component, Else, ElseIf, expose, For, fromTag, If, prep, v, watch } from "@rue/lumo";
import { ion, ionize, Ionized, ionizeWithMarks } from "@rue/quarky";
import { Inert, inert } from "../../../packages/quarky/src/ionize/inert";
import { Well, Wellerman } from "./Well";

function Swap() {
   return Component('')
}

declare module './Well' {
   interface Wellerman {
      $getters: {
         getBoat: () => Ionized<Wellerman['boat']>
      }
      addition: 'hi'
   }
}

export function IonAccess() {

   const $x = ion(7, {
      increment() {
         $x._as($x() + 1)
      },
      as() {

      }
   })

   const frog$ = ionize({
      name: 'sir robin',
      quality: inert({
         gallant: true
      }),
      songs: {
         theyCallMe: 'sir robin the brave'
      }
   })

   const $songs = frog$.$songs


   const songs$ = $songs()


   watch(() => $x() > 10, () => {

   })

   watch(frog$.$name, () => {

   })

   watch(() => frog$.name, () => {

   })

   watch(frog$.songs.$theyCallMe, () => { // Will not track change in quality

   })

   watch(() => frog$.songs.theyCallMe, () => { // will track all changes

   })

   function ionizeWithMods(obj: any, keys: any) {
      return {}
   }

   const wellerman = new Wellerman()

   //@ts-expect-error
   const well$ = ionize.withInertProps(new Well(), {
      water: inert
   })

   //@ts-expect-error
   const wellerman$ = ionize(new Well(), withMarks({
      water: inert
   }))

   //@ts-expect-error
   const well$ = ionize.withMarks(new Well(), {
      water: inert,
      getBoat: 'public'
   })

   const wella$ = ionizeWithMarks(new Well(), {
      water: inert,
      doThat: 'public',
   })

   wella$.waterB

   class AnotherArray<T> extends Array<T> {
      // constructor(...args: T[]){
      //    super(...args);
      // }
      doSomething(){}
   }
   

   const boat$ = wellerman$.getBoat()

   // const list$ = ionize([{name: 9}])

   const list$ = ionize(new AnotherArray({name: 9}, undefined))

   const num = list$[0]

   const removed = list$.splice(0, 1)

   const res = list$.map((item, index, array)=>item.name)

   return Component(
      <>
         <swap:mount/>
         {If($x() > 10,
            <p>{$x()} is greater than 10</p>
         )}
         {ElseIf(5 > $x(),
            <p>{$x()} is less than 5</p>
         )}
         {Else(
            <p>{$x()} is between 5 and 10</p>
         )}
      </>
   )
}



function SvelteB() {
   //@ts-ignore
   const $x = ion(7)

   return Component(
      <>
         <swap:mount />
         {If($x() > 10,
            <p>{$x()} is greater than 10</p>
         )}
         {ElseIf(5 > $x(),
            <p>{$x()} is less than 5</p>
         )}
         {Else(
            <p>{$x()} is between 5 and 10</p>
         )}
      </>
   )
}


export function HelloWorld() {
   return Component(
      <h1>hello world</h1>

   )
}

const $list: any[] = []
let $item;
let $index;

// function ListA() {

//    return (
//       <div>
//          <For const={[$item, $index] = of($list)} key={o => o.id}>
//             <SomeComponent name={$item} />
//             <SomeComponent />
//          </For>
//       </div>
//    )
// }

function ListB() {



   return (
      <div>
         {For($list, m => m.id, (item, $index) => <>
            <SomeComponent name={$item} />
            <SomeComponent />
         </>)}
      </div>
   )
}

function Column() {

   return Component(
      <div>
         <div>{function butterfly() { }}</div>
         <div>{0}</div>
      </div>
   )
}

function of(list: any) {
   return ['', 9] as [string, number]
}
// function For(input: { [key: string]: any, Slot: any[] }) {
//    return Component(
//       ''
//    )
// }

function ColumnB() {

   return Component(
      <SomeComponent name=''>
         {(o = SelectionKit()) => <>
            <div>{o.name}</div>
            <div>{o.name}</div>
         </>}
      </SomeComponent>
   )
}

function SomeComponent(input = fromTag({ name: v<string> })) {
   return Component(
      <></>
   )
}

let o;
const cmp = Component;
const component = Component;
const comp = Component;
const compo = Component;
const cm$ = Component;
const $cm = Component;
const att = fromTag
const $input = fromTag
const fromJSX = fromTag
const inputType = fromTag
const attrs = fromTag
const attributes = fromTag
const attris = fromTag
const attribs = fromTag
const $attributes = fromTag


function ColumnBlock(
   input = fromTag({
      name: v<string>
   })
) {
   const { name } = prep(input)

   return Component(
      <div>{name}</div>
   )
}

// function Boilerplate(
//    input = attributes({

//    })
// ) {
//    const {  } = prep(input)

//    return component(

//    )
// }



function SomeBlock(input: { name?: string | number, Slot?: ((input: any) => any | any[]) | any, let?: any }) {
   return Component(
      ''
   )
}

function SelectionKit() {
   return {
      name: 'hi'
   }
}

function J(input: { for: any, Slot: any, params: any }) {
   return Component(
      ''
   )
}

function MouseKit() {
   return {
      bug: 0
   }
}