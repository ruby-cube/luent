import { ion, ionic } from "@rue/quarky"

const æcount = ion(0)

const frog = ionic({
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