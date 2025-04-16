
type IonizedMethod<M extends Function> = M extends (this: infer U, ...args: infer A) => infer R ? (ThisType<U> & { method: M })['method'] : unknown
type IonizedValue<T> = T extends Function ? IonizedMethod<T> : Ionized<T>;
type Ionized<T> = T extends object ? { [K in keyof T]: IonizedValue<T[K]> } & { ionized: true } : T
type MaybeIonized<T, H> = H extends { ionized: true } ? Ionized<T> : T


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

declare global {

   interface Array<T> {
      splice<H>(this: H, start: number, deleteCount?: number, ...items: T[]): MaybeIonized<T[], H>;
   }
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