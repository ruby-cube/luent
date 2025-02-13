export function pipe(...args: ((prev: any) => any)[]) {
   let output;
   for (const fn of args) {
      output = fn(output)
   }
   return output;
}