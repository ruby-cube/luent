import { Component, Else, ElseIf, For, If, provideAppwide } from "@rue/lumo";
import { Ion, ion, ionize } from "@rue/quarky";
import { inert } from "../../../packages/quarky/src/ionic/notes/inert";
import { Well, Wellerman } from "./Well";
import { Commons } from "../../../packages/lumo/src/hub/Commons";

function Swap() {
   return component('')
}



export function IonAccess() {

   const $x = ion(7, {
      increment() {
         $x.value = $x() + 1
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

   const recs = [0]


   //@ts-expect-error
   const well$ = ionize.withInertProps(new Well(), {
      water: inert
   })

   const wellerman$ = ionize(new Wellerman())

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
      doSomething() { }
   }

   const blah = {
      '1': 0,
      '~': 0,
      '@': 0,
      'z': 0,
      '_': 0,
      '-': 0,
      '0': 0,
      '9': 0,
      '*': 0,
      '&': 0,
      '%': 0,
      '#': 0,
      '$': 0,
      '^': 0,
      '+': 0,
      '=': 0,
      '|': 0,
      '/': 0,
      '?': 0,
      '>': 0,
      ',': 0,
      '.': 0,
      '`': 0,
      '!': 0,
      '(': 0,
   }

   const boat$ = wellerman$.getBoat()

   // const list$ = ionize([{name: 9}])

   const list$ = ionize(new AnotherArray({ name: 9 }, undefined))

   for (const item of list$) {

   }

   const num = list$[0]

   const removed = list$.splice(0, 1)

   const res = list$.map((item, index, array) => item!.name)

   return component(
      <>
         {If($x() > 10, 'remount',
            <p>{$x} is greater than 10</p>
         )}
         {ElseIf(5 > $x(), 'remount',
            <p>{$x} is less than 5</p>
         )}
         {Else('remount',
            <p>{$x} is between 5 and 10</p>
         )}
         {$$series(If($x() > 10, 'remount',
            <p>{$x} is greater than 10</p>
         ),
            ElseIf(5 > $x(), 'remount',
               <p>{$x} is less than 5</p>
            ),
            Else('remount',
               <p>{$x} is between 5 and 10</p>
            ))}
      </>
   )
}

if (x === true) {

}

function SvelteA() {
   //@ts-ignore
   const $x = ion(7)
   let $s: any;

   const discard = DiscardRemountable()

   return component(
      <>
         <mount-remount use:discard={discard}>
            {If($x() > 10,
               $x
            )}
            {ElseIf(5 > $x(),
               <>{$x} is less than 5</>
            )}
            {ElseIf($x,
               <p>{$x} is less than 5</p>
            )}
            {Else(
               <p>{$x} is between 5 and 10</p>
            )}
         </mount-remount>
         <div>
            {$ > $x() + 10}
         </div>
      </>
   )
}

function SvelteA() {
   //@ts-ignore
   const $x = ion(7)
   let $s: any;

   const discard = DiscardRemountable()

   return component(
      <>
         <RemountDemount use:discard={discard}>
            {If($x() > 10,
               $x
            )}
            {ElseIf(5 > $x(),
               <>{$x} is less than 5</>
            )}
            {ElseIf($x,
               <p>{$x} is less than 5</p>
            )}
            {Else(
               <p>{$x} is between 5 and 10</p>
            )}
         </RemountDemount>
         <div>
            {$ > $x() + 10}
         </div>
      </>
   )
}

function SvelteA() {
   //@ts-ignore
   const $x = ion(7)
   let $s: any;

   const discard = DiscardRemountable()

   return component(
      <>
         {If($x() > 10,
            $x
         )}
         {ElseIf(5 > $x(),
            <Remount>
               <div>{$x} is less than 5</div>
            </Remount>
         )}
         {ElseIf($x,
            <Show>
               <p>{$x} is less than 5</p>
            </Show>
         )}
         {Else(
            <Create>
               <p>{$x} is between 5 and 10</p>
            </Create>
         )}
         <div>
            {$ > $x() + 10}
         </div>
      </>
   )
}

function SvelteA() {
   //@ts-ignore
   const $count = ion(7)

   return component(
      <div>
         {If($count, $count)}
      </div>
   )
}

function SvelteA() {
   //@ts-ignore
   const $count = ion(7)

   return component(
      <div>
         {If($count, <>{$count}</>)}
      </div>
   )
}

function ColumnB() {

   return component(
      <SomeComponent name=''>
         {(o = SelectionKit()) =>
            <div>{o.name}</div>}
      </SomeComponent>
   )
}

export function HelloWorld() {
   return component(
      // <h1>hello world</h1>
      <input m:value={value}></input>

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

   return component(
      <div>
         <div>{function butterfly() { }}</div>
         <div>{0}</div>
      </div>
   )
}

function of(list: any) {
   return ['', 9] as [string, number]
}
// function For(input: {[key: string]: any, Slot: any[] }) {
//    return component(
//       ''
//    )
// }

function ColumnB() {

   return component(
      <SomeComponent name=''>
         {(o = SelectionKit()) => <>
            <div>{o.name}</div>
            <div>{o.name}</div>
         </>}
      </SomeComponent>
   )
}

function SomeComponent(input: FromTag<{ name: string }>) {
   return component(
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
const att: FromTag
const $input: FromTag
const fromJSX: FromTag
const inputType: FromTag
const attrs: FromTag
const attributes: FromTag
const attris: FromTag
const attribs: FromTag
const $attributes: FromTag


function ColumnBlock(
   input: FromTag<{
      name: string
   }>()
) {
   const { name } = prep(input)

   return component(
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
   return component(
      ''
   )
}

function SelectionKit() {
   return {
      name: 'hi'
   }
}

function J(input: { for: any, Slot: any, params: any }) {
   const $msg = ion('hi')

   provideAppwide(_appwide_dog_, mu(dog, 'set::setValue')) // auto-readonly unless marked with m
   provideGlobal(_global_dog_, dog) // auto-readonly unless marked with

   // [ ] should mu() allow setting values? ... there's no way to indicate from the child component that you want to be writable...
   // also there's no way to write a setter to trace the set

   return component({
      dog, // auto-reined
      door: 0
   },
      <>
         <Commons provide={{ [_dog_]: mu(dog) }}> //auto-readonly unless marked with m:
            <input value={mu($msg, 'set', '+trace')}></input> // auto-readonly unless marked with m: .. then it's reined
            <input value={$msg} on:input={e => { $msg.value = e.target.value }}></input> // auto-readonly unless marked with m: .. then it's reined
         </Commons>
      </>
   )
}

function MouseKit() {
   return {
      bug: 0
   }
}

function Comp(input: FromTag<{
   value: Ion<{}>
}>) {

   const frog = ionize({
      firstName: 'sir',
      lastName: 'robin',
      get fullname() {
         return frog.firstName + ' ' + frog.lastName
      }
   })
   return component(
      <>
         <h1>{frog.fullname}</h1>
         <input v-model="frog.firstName" />
         <input v-model="frog.lastName" />
      </>
   )
}