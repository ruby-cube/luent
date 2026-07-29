//@ts-nocheck
import { component, template, v } from "luent"
import { ionize } from "@luent/quarky"

function Board() {

   const frog = ionize({
      firstName: 'sir',
      lastName: 'robin',
      get fullname() {
         return this.firstName + ' ' + this.lastName
      }
   })

   return (

      <template>
         <h1>{(frog.fullname)}</h1>
         <input m:value={frog.$firstName} />
         <input m:value={frog.$lastName} />
         {({
            hi: <p>hey</p>,
            bye: <p>bey</p>
         })[key]}
      </template>
   )
}

const dog = MaybeIon<number>('?')

function Comp() {

   const frog = ionize({
      firstName: 'sir',
      lastName: 'robin',
      get fullname() {
         return this.firstName + ' ' + this.lastName
      }
   })

   return (
      <template>
         <h1>{frog.fullname}</h1>
         <input m:value={frog.$firstName} />
         <input m:value={frog.$lastName} />
      </template>
   )
}