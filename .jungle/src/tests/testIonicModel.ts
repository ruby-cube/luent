import { Ionic, ionic } from "@luent/quarky"

const arr = ionic([1])
console.log('key in?', '0' in arr)
arr.pop()
console.log("pop")
console.log('key in?', '0' in arr)