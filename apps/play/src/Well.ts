
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