import { component, Catch, template, createTryCatch, FromTag, Try } from "luent";

export function TestTry() {
   console.log('running TestTry')

   return (

      <div>
         <h2>Stubbon Child</h2>
         {Try(
            <Child></Child>
         )}
         {Catch(err =>
            <ErrorMessage message={err.message}></ErrorMessage>
         )}
         <p>end</p>
      </div>
   )
}

function Child() {
   console.log('Running Child')
   throw 'I was born a restless child'
   return (

      <div>:)</div>
   )
}

function ErrorMessage({ message } : {
   message: string
}) {
   return (

      <div>{message}</div>
   )
}


// , Try(() => [/* @__PURE__ */
//    jsxDEV(Child, {}, void 0, false, {
//       fileName: "/Users/Ruby/Desktop/ruby-cube/rue/.jungle/src/API-exploration/TestTry.tsx",
//       lineNumber: 4,
//       columnNumber: 124
//    }, this)]), Catch((err) => /* @__PURE__ */
//       jsxDEV(ErrorMessage, {
//          message: err.message
//       }, void 0, false, {
//          fileName: "/Users/Ruby/Desktop/ruby-cube/rue/.jungle/src/API-exploration/TestTry.tsx",
//          lineNumber: 4,
//          columnNumber: 156
//       }, this))