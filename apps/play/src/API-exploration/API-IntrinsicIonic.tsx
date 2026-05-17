import { ionic, Ion, Ionic, toRaw } from "@rue/quarky";



// NOTE: IonicModel works, but I worry about performance
class IonicModel implements Ionic<{}> {
   constructor() {
      return ionic(this)
   }

   '~ionic': true;
}

export class Frog {

   name = 'kermit'

   constructor() {
      console.log('this', this)


      this.changeName = ionicBind(this, function () {
         console.log('this in changeName?', this)
         this.name = 'sir robin'
      })
   }

   changeName() {
      console.log('original chang name')
      this.name = 'sir robin'
   }
}

function ionicBind<T>(obj: T, fn: (this: Ionic<T>, ...args: any) => any) {
   return fn.bind(ionic(obj))
}


export class IonicFrog extends IonicModel implements Ionic<IonicFrog> {
   name: string;
   $name!: Ion<string>;

   constructor(name: string) {
      super()
      console.log('this', this)
      this.name = name;
   }

   changeName() {
      console.log('original chang name')
      this.name = 'sir robin'
   }
}

// export class IonicSuperFrog extends IonicFrog {
//    location = 'swamp'

//       constructor() {
//       super()
//       console.log('this', this)
//    }

//    changelocation() {
//       this.location = 'tv'
//    }
// }

// BUT ionic models must not be extended...