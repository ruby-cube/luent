import { asNonlocalReadonly, ion, ionize, isReadonly } from "@rue/quarky";

// IONIZED OBJECT LITERAL
console.log('')
console.log('# ionized object')

export const frog = ionize({
   name: 'kermit',
   setName(name: string) {
      this.name = name
   }
})

const newName = 'kermo'
frog.setName(newName)
console.log(frog.name === newName)
try {
   const roFrog = asNonlocalReadonly(frog)
   roFrog.setName('kermit')
}
catch (err) {
   console.log('yay error', err)
}

try {
   const roFrog = asNonlocalReadonly(frog)
   roFrog.name = 'kermit'
}
catch (err) {
   console.log('yay error', err)
}
const roFrogA = asNonlocalReadonly(frog)
const roFrogB = asNonlocalReadonly(frog)
console.log(roFrogA === roFrogB)
console.log(isReadonly(roFrogA))


// IONIZED CLASS with extra methods

console.log('')
console.log('# ionized class')

class FrogPrince {
   constructor(
      public name: string
   ) {

   }

   qualities: string[] = []

   setName(name: string) {
      this.name = name
   }
}


const frogPrince = ionize(new FrogPrince('sir robin'), {
   shoutName() {
      frogPrince.name += '!'
   }
})

const newName2 = 'kermo'
frogPrince.setName(newName)
console.log(frogPrince.name === newName2)
try {
   const roFrog = asNonlocalReadonly(frogPrince)
   roFrog.setName('kermit')
}
catch (err) {
   console.log('yay error', err)
}

try {
   const roFrog = asNonlocalReadonly(frogPrince)
   roFrog.shoutName()
}
catch (err) {
   console.log('yay error', err)
}

try {
   const roFrog = asNonlocalReadonly(frogPrince)
   roFrog.name = 'kermit'
}
catch (err) {
   console.log('yay error', err)
}
const roFrogPrinceA = asNonlocalReadonly(frogPrince)
const roFrogPrinceB = asNonlocalReadonly(frogPrince)
console.log(roFrogPrinceA === roFrogPrinceB)


// ION
const $count = ion(0, {
   increment() {
      $count.state++
   }
})

console.log('')
console.log('# ion')

const $roCount = asNonlocalReadonly($count)
$roCount.state = 10

try {
   const $roCount = asNonlocalReadonly($count)
   $roCount.increment()
   console.log($roCount)
}
catch (err) {
   console.log('yay error', err)
}

const roCountA = asNonlocalReadonly($count)
const roCountB = asNonlocalReadonly($count)
const roCountC = asNonlocalReadonly(roCountA)
console.log(roCountA === roCountB)
console.log(roCountC === roCountB)


// PLAIN OBJECT
console.log('')
console.log('# plain object')
const kermie = {
   name: 'kermie',
   setName(name: string) {
      this.name = name
   }
}

const newName3 = 'kermo'
kermie.setName(newName3)
console.log(kermie.name === newName3)
try {
   const roFrog = asNonlocalReadonly(kermie)
   roFrog.setName('kermit')
}
catch (err) {
   console.log('yay error', err)
}

try {
   const roFrog = asNonlocalReadonly(kermie)
   roFrog.name = 'kermit'
}
catch (err) {
   console.log('yay error', err)
}
const roKermieA = asNonlocalReadonly(kermie)
const roKermieB = asNonlocalReadonly(kermie)
const roKermieC = asNonlocalReadonly(roKermieA)
console.log(roKermieA === roKermieB)
console.log(roKermieC === roKermieB)
console.log(isReadonly(roKermieB))

// DEEP READONLY
console.log('')
console.log('# plain object deep readonly')
const frogPrince2 = new FrogPrince('sir robin')
const roFrogPrince = asNonlocalReadonly(frogPrince2)
console.log(isReadonly(roFrogPrince.qualities))
console.log(!isReadonly(frogPrince2.qualities))

console.log('')
console.log('# ionized object deep readonly')
const frogPrince3 = ionize(new FrogPrince('sir robin'))
const roFrogPrince3 = asNonlocalReadonly(frogPrince3)
console.log(isReadonly(roFrogPrince3.qualities))
console.log(!isReadonly(frogPrince3.qualities))