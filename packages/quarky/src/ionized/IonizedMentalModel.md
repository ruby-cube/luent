```ts
const list = ionized([new Frog(), new Frog()], [INERT])

list.push(ionized({ name: 'frog' }))

// , inz({ name: 'dog' }))

const frog = inz(new Frog())

const swamp = ionize({
   logCreature: frog,
   mud: {
      frog
   }
})

const frog = new Frog()

swamp.$.logCreature = frog

const $list = ion.ionize([new Frog()])


$list()[0]

const $swamp = ion.ionize({ logCreature: new Frog() })

console.log($swamp.$.state)

const swamp = $swamp.$.state = { logCreature: new Frog() } // will swamp be ionized or raw?

$swamp().$.logCreature = new Frog()

const frog = swamp.$.logCreature = new Frog() // frog will be ionized


list.$.push(new Frog())



swamp.$.logCreature = new Frog()  // also swamp.$logCreature.$.state = new Frog() 

const frog = swamp.logCreature // ionized


const item = list.at(-1)

const item = list[list.length - 1]

const item = list[3] = new Frog() // compiler error

const item = list[3] = ionize(new Frog())


console.log(swamp.$.logCreature === frog)
console.log(swamp.logCreature !== frog)

console.log(list)

// how can we have pending state for an object with private properties? The object must be cloned, but it must have a clone method

class Frog {
    
    #secretName = 'sir robin the brave'
    punctuation = '!'
    
    get name(){
        return this.#secretName + this.punctuation
    }

    brave = true;
    
    get qualities() {
        return this.brave ? 'brave' : 'none'
    }
}

const frog = new Proxy(new Frog(), {
    get(target, key){
        console.log('get', key)
        if (key === 'name') return getName.bind(target)()
        if (key === 'qualities') return getQualities.bind(frog)()
        return target[key]
    },
    set(target, key, value){
        console.log('set', key, ':', value)
        target[key] = value
        return true
    }
})

const getQualities = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(new Frog()), 'qualities').get
const getName = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(new Frog()), 'name').get

console.log('frog:', frog.qualities)
console.log('name:', frog.name)






-----

//TODO: Arrays need to have pArray.. array items cannot be getters and setters, they need to be deleted
let initArray = [1, 2, 3] // make sure initArray doesn't get stuck in memory. set to null after finish initializing and don't use in closures

const indexArray = [$0, $1, $2] // this array will continue to grow .. maybe use atomicOp instead, where they are only created if explicitly watched?

const state = {
    oArray: [],
    pArray: NULL
}

function cloneWithDescriptors(collection){
   const clone = [...collection] //QUESTION: for arrays, we don't need to do this right? we want the getters, new Set(collection) // new Map(collection)
   Object.defineProperties(clone, Object.getOwnPropertyDescriptors(collection))
   return clone
}

let p = false;

const proxy = new Proxy(state, {
        get(target, key){
        console.log('get', key)
        if (target.array[key] instanceof Function) return target.array[key].bind(proxy)
            if (p) return state.pArray[key]
        return state.array[key]
    },
    set(target, key, value){
        console.log('set', key, '=', value)
        const array = p ? state.pArray : state.array
        array[key] = value
        return true
    }
})

console.log(proxy)

console.log([...proxy])

proxy.push(8)

console.log([...proxy])


p = true

console.log('------')

console.log([...proxy])

proxy.push(8)
console.log([...proxy])

console.log(proxy)



---

const initArray = new Set([1,2,3])

const quark = {
    array: new Set(initArray),
    pArray: undefined
}

quark.array.add = (value) => {
    console.log('adding')
    initArray.add.apply(p ? quark.pArray : quark.array, [value])
}

const getSize = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(initArray), 'size').get


Object.defineProperty(quark.array, 'size', {
    get(){
        console.log('getting size')
        return getSize.apply(p ? quark.pArray : quark.array)
    }
})

let p = false;

quark.array.add(9)

console.log(Array.from(quark.array))
console.log(quark.array.size)

quark.pArray = new Set(quark.array)
Object.defineProperties(quark.pArray, Object.getOwnPropertyDescriptors(quark.array))
    // Object.create(Object.getPrototypeOf(quark.array), Object.getOwnPropertyDescriptors(quark.array))

console.log(quark.pArray)

p = true;

quark.pArray.add(10)

console.log(Array.from(quark.pArray))
console.log(quark.pArray.size)

console.log('---')

console.log(Array.from(quark.array))
console.log(quark.array.size)

```

