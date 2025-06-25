import { Catch, component, fromTag, Try } from "@rue/lumo";

export function TestTry() {
   console.log('running TestTry')

   return component(
      <div>
         <h2>Stubbon Child</h2>
         {$$series( //TODO: compiler
            Try(() => //TODO: compiler
               <Child></Child>
            ),
            Catch(err =>
               <ErrorMessage message={err.message}></ErrorMessage>
            )
         )}
         <p>end</p>
      </div>
   )
}

function Child() {
   console.log('Running Child')
   // throw 'I was born a restless child'
   return component(
      <div>:)</div>
   )
}

function ErrorMessage({ message } = fromTag<{
   message: string
}>()) {
   return component(
      <div>{message}</div>
   )
}