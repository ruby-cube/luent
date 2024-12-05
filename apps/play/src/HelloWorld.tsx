import { Component, Else, ElseIf, expose, For, fromTag, If, prep, v } from "@rue/lumo";

function Swap() {
   return Component('')
}


function Svelte() {
   //@ts-ignore
   const $x = ion(7)

   return Component(
      <>
         <swap:mount />
         {If($x() > 10, <>
            <SvelteB></SvelteB>
            <p>{$x()} is greater than 10</p>
         </>)}
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
         <div>{function butterfly(){}}</div>
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

let o;
const cmp = Component;
const component = Component;
const comp = Component;
const compo = Component;
const cm$ = Component;
const $cm = Component;
const att = fromTag
const $input = fromTag
const fromTag = fromTag
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