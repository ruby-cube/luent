import { ion, ionic } from "@rue/quarky"

const $count = ion(0)

const frog = ionic({
   name: 'kermit',
   get fullname() {
      return this.name + 'the frog'
   },
   $count,
   something() {
      return 9
   }
})

frog.$count()

frog.something()