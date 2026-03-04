// mutating methods

import { Mu } from "./mu-linting";

export class Something {
   something: string = 'bar'

   a: number = 0

   changeSomething() {
      this.something = 'foo'
   }

   push() {
   this.a = 8
   }

   readSomething() {
      return this.something;
   }

   get aboo() {
      return this.a
   }

   getA(){
      return this.a
   }
}

type Other = {
   a: string
   changeA: (this: Mu<Other>) => void
   readA: () => string
}

