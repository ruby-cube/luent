// detect whether a setup property has been forwarded by detected if it has been accessed


function toSetup(tagBindings: object) {
   return new Proxy(tagBindings, {
      get() {
         
      }
   })
}