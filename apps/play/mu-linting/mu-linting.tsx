import { FromTag, template } from "@rue/lumo"
import { asIonic, Ion, Ionic } from "@rue/quarky"
import { Something } from "./external-file"

type Frog = { name: string }

function mu<T>(value: T): Mu<T> {
   return value as Mu<T>
}

export type Mu<T> = T & { '~mutable': true }




const froggy: Frog = { name: 'kermit' }

doSomething(mu(froggy))


function doSomething(frog: Mu<Frog>) {

}


type CompoInput = {
   'mu?:frog': Ionic<Frog>
   dog: { name: string }
   something: Something,
   list: any[]
}


function Compo({ dog, something, list, mu: { frog } }: FromTag<CompoInput>) {

   function doSomething() {
      if (frog) frog.name = 'sir robin' // OK
      dog.name = 'spot' // ERROR: Mutating external objects disallowed
      something.changeSomething() // ERROR: Mutating external objects disallowed
      something.push() // ERROR: Mutating external objects disallowed
      const s = something.readSomething() // OK
      something.getA()
      something.aboo
   }

   return template(
      <div></div>
   )
}


function CompoB({ dog, mu }: FromTag<CompoInput>) {

   const localObj = asIonic({ name: 'local', store: 9 })

   function doSomething() {
      mu.frog.name = 'sir robin' // OK
      localObj.name = 'something else' // OK
      localObj.store = 0
      dog.name = 'spot' // ERROR: Mutating external objects disallowed
   }

   return template(
      <div></div>
   )
}

function App() {
   const $count = Ion(0)
   const frog = asIonic({ name: 'kermit' })
   const something = new Something()

   return template(
      <>
         <input mu:value={$count}></input>
         <Compo mu:frog={frog} dog={{ name: 'fido' }}></Compo>
      </>
   )
}


/*
Please create a linter that will: 
- only allow mutations of arguments in components if the object is destructured or nested in the component's `mu` object (passed in as part of props), 
      - e.g. `mu.frog.name = 'kermit'` is ok
      - e.g. `frog.name = 'kermit'` is ok, iff frog is destructured from the `mu` object, otherwise it should be disallowed
- only allow mutations in non-component functions if the object is typed as a Mu<> object

Notes:
- locally declared objects are okay to mutate
- if an external object satisfies the above criteria, deep mutation is also okay, e.g. mu.frog.details.location = 'swamp' 
- components are functions that return a template via template()

If it's technically possible, also disallow mutating methods. For example, in the `something` object, 

Mutating methods are 
- either marked in their type declaration with the `this` argument as Mu<>, e.g. { changeB: (this: Mu<Obj>) => void }
- or the linter auto-detects whether the method mutates the object by analyzing the inner code. If the method reassigns any properties or calls any other mutating methods, it is itself a mutating method.
*/