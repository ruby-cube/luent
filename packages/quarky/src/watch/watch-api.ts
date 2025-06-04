//@ts-nocheck

watch($style, {
   effect: ({ current: styles }) => {
      doSomething()
   }
})


watch($style, ({ current: styles }) => {
   doSomething()
})


watch($style, {
   phase: POSTRENDER,
   effect: ({ current: styles }) => {
      doSomething()
   }
})

watch($style, {
   phase: POSTRENDER,
}, ({ current: styles }) => {
   doSomething()
})


watch($style, ({ current: styles }) => {
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
   effect: ({ current: styles }) => {
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
   effect: ({ current: styles }) => {
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
}, ({ current: styles }) => {
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

watch($style, ({ current: styles }) => {
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

watch($style, ({ current: styles }) => {
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