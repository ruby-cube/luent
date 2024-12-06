
export class Well {
   water: {
      clear: true
   }

   constructor() {
      this.water = {
         clear: true
      }
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