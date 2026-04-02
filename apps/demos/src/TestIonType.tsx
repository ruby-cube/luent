import { Ion, Ionic } from "@rue/quarky"

const æcount = Ion(0)

const frog = Ionic({
   name: 'kermit',
   get fullname() {
      return this.name + 'the frog'
   },
   æcount,
   something() {
      return 9
   }
})

frog.æcount()

frog.something()