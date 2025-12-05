export function* gen() {
   let i = 100;
   while (i--) {
      console.log(i)
      if (i % 10 === 0) yield i;
   }
}