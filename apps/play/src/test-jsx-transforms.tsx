
import { component, If, JSXNode, FromTag, } from "@rue/lumo";
import { ion } from "@rue/quarky";

// - [ ]  transform slot to render function for:

// SLOTS

// text
function CompA() {
   return component(
      <div>Hello</div>
   )
}

// ion
function CompB() {
   const $hello = Ion('hi')

   return component(
      <div>{$hello}</div>
   )
}

// interpolated (to array)
function CompC() {
   const $hello = Ion('hi')

   return component(
      <div>greeting: {$hello}</div>
   )
}



// derived ion
function CompD() {
   const $hello = Ion('hi')

   return component(
      <div>{$hello() + '!'}</div>
   )
}

// transformed derived ion slot
function CompDTransform() {
   const $hello = Ion('hi')

   return component(
      <div>{() => function $() { return $hello() + '!' }}</div>
   )
}

// another element
function CompE() {
   const $hello = Ion('hi')

   return component(
      <div><p>{$hello() + '!'}</p></div>
   )
}

// a component
function CompG() {

   return component(
      <div><CompA /></div>
   )
}

// other elements
function CompF() {
   const $hello = Ion('hi')

   return component(
      <div>
         <h1>Hello World</h1>
         <p>{$hello() + '!'}</p>
      </div>
   )
}

// component with slot: single child
function Parent() {
   return component(
      <Child>
         <div>hi</div>
      </Child>
   )
}

// component with slot: multi childs
function ParentB() {
   return component(
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
// component with sequence expression
function ParentD() {
   return component(
      <Child>
         {(o = kit(),
            <div>
               hi
            </div>
         )}
      </Child>
   )
}
// component with sequence expression: fragment
function ParentD2() {
   return component(
      <Child>
         {(o = kit(), <>
            <div>hi</div>
            <div>hi</div>
         </>)}
      </Child>
   )
}

// component with slot input
function ParentE() {
   return component(
      <Child> {o =>
         <div>hi</div>}
      </Child>
   )
}

// component with slot input with fragment
function ParentE3() {
   return component(
      <Child>
         {o => <>
            <div>hi</div>
         </>}
      </Child>
   )
}

// component with slot input with parentheses
function ParentE2() {
   return component(
      <Child> {(o) =>
         <div>hi</div>}
      </Child>
   )
}

// component with named slot
function ParentC() {
   return component(
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

// component with named slot: with slot input or render function
function ParentF() {
   return component(
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
   const $active = Ion(true);

   return component(
      <div>
         {If($active,
            <p>yay</p>
         )}
      </div>
   )
}

// Template function: with fragment
function ParentG3() {
   const $active = Ion(true);

   return component(
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
   const $active = Ion(true);

   return component(
      <div>
         {If($active, (o = kit(),
            <p>yay</p>
         ))}
      </div>
   )
}

function Child(input: FromTag<{
   Slot: (o?: any) => JSXNode,
   something: string
}>) {
   const { Slot } = input

   return component(
      ''
   )
}


//     - [ ]  non-named Slots (for both elements and components)
//     - [ ]  conditional functions, iterative functions


// - [ ]  transform derived value in template, node setup and style objects to `function $(){return *;}`
function isDerivation() {
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


