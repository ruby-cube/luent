// https://github.com/lukeed/uid

export function UIDGenerator(len: number){
   let IDX = 36, HEX = '';
   while (IDX--) HEX += IDX.toString(36);
   
   return function uid() {
     let str = '', num = len || 11;
     while (num--) str += HEX[Math.random() * 36 | 0];
     return str;
   }
}


//TODO: add a unique collaborator/browser prefix so collaborators never generate the same id