
import { Component, fromTag, If, NodeEntity, prep, v } from "@rue/lumo";
import { ion } from "@rue/quarky";

// - [ ]  transform slot to render function for:

// SLOTS

// text
function CompA() {
   return Component(
      <div>Hello</div>
   )
}

// ion
function CompB() {
   const $hello = ion('hi')

   return Component(
      <div>{$hello}</div>
   )
}

// interpolated (to array)
function CompC() {
   const $hello = ion('hi')

   return Component(
      <div>greeting: {$hello}</div>
   )
}



// derived ion
function CompD() {
   const $hello = ion('hi')

   return Component(
      <div>{$hello() + '!'}</div>
   )
}

// transformed derived ion slot
function CompDTransform() {
   const $hello = ion('hi')

   return Component(
      <div>{() => function $() { return $hello() + '!' }}</div>
   )
}

// another element
function CompE() {
   const $hello = ion('hi')

   return Component(
      <div><p>{$hello() + '!'}</p></div>
   )
}

// a component
function CompG() {

   return Component(
      <div><CompA /></div>
   )
}

// other elements
function CompF() {
   const $hello = ion('hi')

   return Component(
      <div>
         <h1>Hello World</h1>
         <p>{$hello() + '!'}</p>
      </div>
   )
}

// Component with slot: single child
function Parent() {
   return Component(
      <Child>
         <div>hi</div>
      </Child>
   )
}

// Component with slot: multi childs
function ParentB() {
   return Component(
      <Child>
         <div>hi</div>
         <div>bye</div>
      </Child>
   )
}

function kit() {
   return {}
}
let o: any;
// Component with sequence expression
function ParentD() {
   return Component(
      <Child>
         {(o = kit(),
            <div>
               hi
            </div>
         )}
      </Child>
   )
}
// Component with sequence expression: fragment
function ParentD2() {
   return Component(
      <Child>
         {(o = kit(), <>
            <div>hi</div>
            <div>hi</div>
         </>)}
      </Child>
   )
}

// Component with slot input
function ParentE() {
   return Component(
      <Child> {o =>
         <div>hi</div>}
      </Child>
   )
}

// Component with slot input with fragment
function ParentE3() {
   return Component(
      <Child>
         {o => <>
            <div>hi</div>
         </>}
      </Child>
   )
}

// Component with slot input with parentheses
function ParentE2() {
   return Component(
      <Child> {(o) =>
         <div>hi</div>}
      </Child>
   )
}

// Component with named slot
function ParentC() {
   return Component(
      <Child>
         {{
            title:
               <div>hi</div>,
            description:
               <div>bye</div>
         }}
      </Child>
   )
}

// Component with named slot: with slot input or render function
function ParentF() {
   return Component(
      <Child>
         {{
            title: (o) =>
               <div>hi</div>,
            description: () =>
               <div>bye</div>
         }}
      </Child>
   )
}

// Template function
function ParentG() {
   const $active = ion(true);

   return Component(
      <div>
         {If($active,
            <p>yay</p>
         )}
      </div>
   )
}

// Template function: with fragment
function ParentG3() {
   const $active = ion(true);

   return Component(
      <div>
         {If($active, <>
            <p>yay</p>
            <p>yay</p>
         </>)}
      </div>
   )
}


// Template function: with sequence expression
function ParentG2() {
   const $active = ion(true);

   return Component(
      <div>
         {If($active, (o = kit(),
            <p>yay</p>
         ))}
      </div>
   )
}

function Child(input = fromTag({
   Slot: v<(o?: any) => NodeEntity>,
   something: v<string>('?')('dog')
})) {

   const { Slot } = prep(input)

   return Component(
      ''
   )
}


//     - [ ]  non-named Slots (for both elements and components)
//     - [ ]  conditional functions, iterative functions


// - [ ]  transform derived value in template, node setup and style objects to `function $(){return *;}`
function isDerivation(){
   // isExpression
   // hasCallExpression  // we can't statically differentiate a non-ionic expression from an ion expression, so we treat any calls as possibly having an ion call in it.
}

export default function (babel) {
   const { types: t } = babel;
   
   return {
     name: "ast-transform",
     visitor: {
       Identifier(path) {
         console.log(t)
         //path.node.name = path.node.name.split('').reverse().join('');
       }
     }
   };
 }
 

// - [ ]  add `e` argument to `target()`
// - [ ]  transform default input value to a getter function `v<string>('??')('dog')`


