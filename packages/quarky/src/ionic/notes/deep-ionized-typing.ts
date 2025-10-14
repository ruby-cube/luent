
//QUESTION: Can I write Ionized<> such that it checks if a type is ionizable?
// QUESTION: Can Typescript distinguish between an Array vs an extension of an Array?




class Frog {
   name: string = 'sir robin'

   qualities: string[] = []

   getQualities() {
      return this.qualities
   }
}

interface Frog {
   getQualities<H extends Frog>(this: H): H['qualities']
}




function ionize<T>(obj: T) {
   return obj as Ionized<T>
}



export const frog = new Frog()

const qualities = frog.getQualities()

//@ts-expect-error
qualities.ionized

const froggy = ionize(frog);

froggy.ionized

const qualia = froggy.getQualities()
const qualia2 = froggy.qualities


qualia.ionized

const arr = ionize(['hi'])
arr.splice


const removed = arr.splice(0)