// @ts-nocheck

// WINNER:
export function List() {
   const list = asIonic([])
   const user = asIonic({
      id: 0,
      name: 'john'
   })
   const selected = IonicSet()
   const tree = IonicTree({})   // Ionic(new Tree()) under the hood
}


export function List() {
   const list = Ionized([])
   const user = Ionized({
      id: 0,
      name: 'john'
   })
   const selected = Ionized(new Set()) // X cumbersome
   const tree = IonicTree({})
}

export function List() {
   const list = IonicArray([]) // X Redundant

   const tree = IonicTree({})
}

export function List() {
   const list = IonicArray() // inconsistent
   const user = IonicObject({
      id: 0,
      name: 'john'
   })


   const tree = IonicTree({})
}





