//@ts-nocheck

watch($style, {
   effect: ({ state: styles }) => {
      doSomething()
   }
})


watch($style, ({ state: styles }) => {
   doSomething()
})


watch($style, {
   phase: POSTRENDER,
   effect: ({ state: styles }) => {
      doSomething()
   }
})

watch($style, {
   phase: POSTRENDER,
}, ({ state: styles }) => {
   doSomething()
})


watch($style, ({ state: styles }) => {
   doSomething()
}, { phase: POSTRENDER })


watch($style, () => {
   doSomething()
}, {
   phase: POSTRENDER
})


watch($style, {
   eager: true,
   phase: RENDER,
   effect: ({ state: styles }) => {
      for (const key in styles) {
         const value = styles[key]
         if (isIon(value)) {

            watch(value, {
               eager: true,
               phase: RENDER,
               effect: () => {
                  setStyle(key, value);
               }
            })

         }
         else {
            setStyle(key, value)
         }
      }
   }
})

watch($style, {
   effect: ({ state: styles }) => {
      for (const key in styles) {
         const value = styles[key]
         if (isIon(value)) {

            watch(value, {
               effect: () => {
                  setStyle(key, value);
               }
            })

         }
         else {
            setStyle(key, value)
         }
      }
   }
})

watch($style, {
   eager: true,
   phase: RENDER
}, ({ state: styles }) => {
   for (const key in styles) {
      const value = styles[key]
      if (isIon(value)) {

         watch(value, {
            eager: true,
            phase: RENDER
         }, () => {
            setStyle(key, value);
         })
      }
      else {
         setStyle(key, value)
      }
   }
})

watch($style, ({ state: styles }) => {
   for (const key in styles) {
      const value = styles[key]
      if (isIon(value)) {
         watch(value, () => {
            setStyle(key, value);
         })
      }
      else {
         setStyle(key, value)
      }
   }
})

watch($style, ({ state: styles }) => {
   for (const key in styles) {
      const value = styles[key]
      if (isIon(value)) {
         watch(value, () => {
            setStyle(key, value);
         }, {
            eager: true,
            phase: RENDER
         })
      }
      else {
         setStyle(key, value)
      }
   }
}, {
   eager: true,
   phase: RENDER
})