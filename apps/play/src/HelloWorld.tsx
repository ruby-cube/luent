import { Component, Else, ElseIf, expose, getAttributes, If, prep, v } from "@rue/lumo";

function Swap() {
   return Component('')
}


function Svelte() {
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

switch (key) {
   case value:

      break;

   default:
      break;
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

function ListA() {

   return (
      <div>
         <For const={[$item, $index] = of($list)} key={o => o.id}>
            <SomeComponent name={$item} />
            <SomeComponent />
         </For>
      </div>
   )
}

function ListB() {

   return (
      <div>
         {For($list, o => o.id, (item, $index) => <>
            <SomeComponent name={$item} />
            <SomeComponent />
         </>)}
      </div>
   )
}

function Column() {

   return Component(
      <SomeComponent name='' let={o = $(SomeComponent)}        >
         <div>{o.name}</div>
         <div>{o.name}</div>
      </SomeComponent>
   )
}

function of(list: any) {
   return ['', 9] as [string, number]
}
function For(input: { [key: string]: any, Slot: any[] }) {
   return Component(
      ''
   )
}

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
const att = getAttributes
const $input = getAttributes
const fromTag = getAttributes
const fromJSX = getAttributes
const inputType = getAttributes
const attrs = getAttributes
const attributes = getAttributes
const attris = getAttributes
const attribs = getAttributes
const $attributes = getAttributes


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