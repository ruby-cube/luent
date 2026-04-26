export function assertª<T extends () => any>(getter: T): T {
   if (typeof getter !== 'function' || getter.length !== 0) {
      throw new TypeError(`Getter must be a function: ${getter}`)
   }
   return getter
}



   //  - [ ] destructureª
   //  - [ ] absorbª, absorbsª
   //  - [ ] assertª
   //  - [ ] assertµ
   //  - [ ] toª
   //  - [ ] ªof

