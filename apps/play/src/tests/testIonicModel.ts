import { Ionic } from "@rue/quarky"

const arr = Ionic([1])
console.log('key in?', '0' in arr)
arr.pop()
console.log("pop")
console.log('key in?', '0' in arr)