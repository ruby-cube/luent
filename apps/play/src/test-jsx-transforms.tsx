
import { template, If, JSXNode, FromTag, } from "@rue/luent";

// - [ ]  transform slot to render function for:

// SLOTS

// text
function CompA() {
   return template(
      <div>Hello</div>
   )
}

// ion
function CompB() {
   const $hello = Ion('hi')

   return template(
      <div>{$hello}</div>
   )
}

// interpolated (to array)
function CompC() {
   const $hello = Ion('hi')

   return template(
      <div>greeting: {$hello}</div>
   )
}



// derived ion
function CompD() {
   const $hello = Ion('hi')

   return template(
      <div>{$hello() + '!'}</div>
   )
}

// transformed derived ion slot
function CompDTransform() {
   const $hello = Ion('hi')

   return template(
      <div>{() => function $() { return $hello() + '!' }}</div>
   )
}

// another element
function CompE() {
   const $hello = Ion('hi')

   return template(
      <div><p>{$hello() + '!'}</p></div>
   )
}

// a component
function CompG() {

   return template(
      <div><CompA /></div>
   )
}

// other elements
function CompF() {
   const $hello = Ion('hi')

   return template(
      <div>
         <h1>Hello World</h1>
         <p>{$hello() + '!'}</p>
      </div>
   )
}

// component with slot: single child
function Parent() {
   return template(
      <Child>
         <div>hi</div>
      </Child>
   )
}

// component with slot: multi childs
function ParentB() {
   return template(
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
   return template(
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
   return template(
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
   return template(
      <Child> {o =>
         <div>hi</div>}
      </Child>
   )
}

// component with slot input with fragment
function ParentE3() {
   return template(
      <Child>
         {o => <>
            <div>hi</div>
         </>}
      </Child>
   )
}

// component with slot input with parentheses
function ParentE2() {
   return template(
      <Child> {(o) =>
         <div>hi</div>}
      </Child>
   )
}

// component with named slot
function ParentC() {
   return template(
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
   return template(
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

   return template(
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

   return template(
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

   return template(
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

   return template(
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


// - [ ]  transform default input value to a getter function `v<string>('??')('dog')`


