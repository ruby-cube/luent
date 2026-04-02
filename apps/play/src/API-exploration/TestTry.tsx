import { Catch, template, createTryCatch, FromTag, Try } from "@rue/luent";

export function TestTry() {
   console.log('running TestTry')

   return template(
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
   return template(
      <div>:)</div>
   )
}

function ErrorMessage({ message } : FromTag<{
   message: string
}>) {
   return template(
      <div>{message}</div>
   )
}


// , Try(() => [/* @__PURE__ */
//    jsxDEV(Child, {}, void 0, false, {
//       fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/API-exploration/TestTry.tsx",
//       lineNumber: 4,
//       columnNumber: 124
//    }, this)]), Catch((err) => /* @__PURE__ */
//       jsxDEV(ErrorMessage, {
//          message: err.message
//       }, void 0, false, {
//          fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/API-exploration/TestTry.tsx",
//          lineNumber: 4,
//          columnNumber: 156
//       }, this))