import { Component, Else, ElseIf, For, If, provideRoot } from "@rue/luent";
import { Ion, ionic, ion } from "@rue/quarky";
import { inert } from "../../../packages/x-old/x_inert";
import { Well, Wellerman } from "./Well";
import { Context } from "../../../packages/luent/src/context/Context";

function Swap() {
   return template('')
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

   return template(
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

   return template(
      <>
         <remount-view discard={discard}>
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
         </remount-view>
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

   return template(
      <>
         <RemountDemount discard={discard}>
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

   return template(
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

   return template(
      <div>
         {If($count, $count)}
      </div>
   )
}

function SvelteA() {
   //@ts-ignore
   const $count = ion(7)

   return template(
      <div>
         {If($count, <>{$count}</>)}
      </div>
   )
}

function ColumnB() {

   return template(
      <SomeComponent name=''>
         {(o = SelectionKit()) =>
            <div>{o.name}</div>}
      </SomeComponent>
   )
}

export function HelloWorld() {
   return template(
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

   return template(
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
//    return template(
//       ''
//    )
// }

function ColumnB() {

   return template(
      <SomeComponent name=''>
         {(o = SelectionKit()) => <>
            <div>{o.name}</div>
            <div>{o.name}</div>
         </>}
      </SomeComponent>
   )
}

function SomeComponent(input: FromTag<{ name: string }>) {
   return template(
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

   return template(
      <div>{name}</div>
   )
}

// function Boilerplate(
//    input = attributes({

//    })
// ) {
//    const {  } = prep(input)

//    return template(

//    )
// }



function SomeBlock(input: { name?: string | number, Slot?: ((input: any) => any | any[]) | any, let?: any }) {
   return template(
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

   provideRoot(_appwide_dog_, mu(dog, 'set::setValue')) // auto-readonly unless marked with m
   provideGround(_global_dog_, dog) // auto-readonly unless marked with

   // [ ] should mu() allow setting values? ... there's no way to indicate from the child component that you want to be writable...
   // also there's no way to write a setter to trace the set

   return template({
      dog, // auto-reined
      door: 0
   },
      <>
         <Context provide={{ [_dog_]: mu(dog) }}> //auto-readonly unless marked with m:
            <input value={mu($msg, 'set', '+trace')}></input> // auto-readonly unless marked with m: .. then it's reined
            <input value={$msg} on:input={e => { $msg.value = e.target.value }}></input> // auto-readonly unless marked with m: .. then it's reined
         </Context>
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
   return template(
      <>
         <h1>{frog.fullname}</h1>
         <input v-model="frog.firstName" />
         <input v-model="frog.lastName" />
      </>
   )
}