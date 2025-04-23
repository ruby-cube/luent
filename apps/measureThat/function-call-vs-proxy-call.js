function setup() {
   const obj = {
       a: 4
   }

   function getA() {
       return obj.a
   }

   const proxy = new Proxy(getA, {})
   
   return [getA, proxy]
}

const [_getA, _proxy] = setup()

function getExisting() {
   return [_getA, _proxy]
}

const [getA, proxy] = setup()
const a = getA()