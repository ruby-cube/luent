import { Ionized } from "@luent/quarky"

export class Well {
   water: {
      clear: true
   }
   waterB?: {
      clear: true
   } 

   swell: boolean = true

   constructor() {
      this.water = {
         clear: true
      }
   }

   doThis(){

   }

   doThat(){

   }
}

export class Wellerman {
   boat: {
      sturdy: true
   }
   constructor() {
      this.boat = {
         sturdy: true
      }
   }

   getBoat() {
      return this.boat
   }
}

declare module './Well' {
   interface Wellerman {
      '~$methods': {
         getBoat: () => Ionized<Wellerman['boat']>
      }
      addition: 'hi'
   }
}