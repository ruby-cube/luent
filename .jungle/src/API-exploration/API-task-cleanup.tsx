//@ts-nocheck
import { getActiveFlask } from "@rue/flask";
import { component, template, fromContext, RENDER } from "@rue/luent";
import { trackEffect } from "@rue/quarky";



// [ ] async context - context
//     - nested functions needing context like IonicTodo
// [X] flask cleanup

// A) make async context as invisible as possible (with compiler, etc) <<----THIS.. it's too ugly to be visible T_T ... but how do we know what to transform?
//    - devs don't have to worry, will take async context access for granted
// B) make async context explicit when needed
//    - devs have to keep in mind, may forget
// C) make async context ALWAYS explicit
//    - devs have to keep in mind


export function ScoreBoard() {

   // synchronous
   ionicSyncTask(() => {

   })

   // prelude
   ionicPreTask(async ({ setup, fromContext }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = useSelection(x, y)
      console.log('other stuff', fromContext(ScoreBoard.stuff))
   })

   ionicRenderTask(async ({ setup, ctxz }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = ctxz(() => useSelection(x, y))
      const newTodo = ctxz(() => IonicTodo(todo))
      console.log('other stuff', fromContext(ScoreBoard.stuff))
   })

   ionicRenderTask(async ({ setup, cxz }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = cxz(useSelection(x, y))
      const newTodo = cxz(IonicTodo(todo))
      console.log('other stuff', fromContext(ScoreBoard.stuff))
   })

   ionicRenderTask(async ({ setup, cxz }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = cxz(useSelection)(x, y)
      const newTodo = cxz(IonicTodo)(todo)
      console.log('other stuff', fromContext(ScoreBoard.stuff))
   })

   ionicRenderTask(async ({ setup, useSelection, IonicTodo }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromContext(ScoreBoard.stuff))

   }, { contextualize: { useSelection, IonicTodo } })

   ionicRenderTask(async o => {
      o.setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = o.useSelection(x, y)
      const newTodo = o.IonicTodo(todo)
      console.log('other stuff', o.fromContext(ScoreBoard.stuff))

   }, { contextualize: { useSelection, IonicTodo } })

   ionicRenderTask(async ({ run, setup }) => {
      setup(() =>
         setInterval(() => coop(() => {
            console.log("hi")
         }), 500)
      ).cleanup(clearInterval)
      await coop(render())
      await coop(res => {
         if (res.error) {
            $error.value = res.error
            return;
         }
         const { } = useSelection(x, y)
         const newTodo = IonicTodo(todo)
         console.log('other stuff', fromContext(ScoreBoard.stuff))
      })
      return coop()
   })


   ionicRenderTask(async ({ span, spot, tethered, setup }) => {
      setup((count = 0) =>
         setInterval(tethered(() => {
            count++
            console.log("hi", count)
         }), 500)
      ).cleanup(clearInterval)
      await span(render())
      await spot(res => {
         if (res.error) {
            $error.value = res.error
            return;
         }
         const { } = useSelection(x, y)
         const newTodo = IonicTodo(todo)
         console.log('other stuff', fromContext(ScoreBoard.stuff))
      })
   })

   ionicRenderTask(o => {
      let count = 0

      o.interval(500, () => {
         count++
         console.log("hi", count)
      })
      o.await(render(), res => {
         if (res.error) {
            $error.value = res.error
            return;
         }
         const { } = useSelection(x, y)
         const newTodo = IonicTodo(todo)
         console.log('other stuff', fromContext(ScoreBoard.stuff))
      })
   })

   ionicRenderTask(async ({ span, spot, tether, setup }) => {
      setup((count = 0) =>
         setInterval(tethered(() => {
            count++
            console.log("hi", count)
         }), 500)
      ).cleanup(clearInterval)
      await span(o => render())
      await spot(o => {
         const { } = useSelection(x, y)
         const newTodo = IonicTodo(todo)
         console.log('other stuff', fromContext(ScoreBoard.stuff))
      })
   })

   ionicRenderTask(async ({ span, spot, tether, setup }) => {
      setup((count = 0) =>
         setInterval(tethered(() => {
            count++
            console.log("hi", count)
         }), 500)
      ).cleanup(clearInterval)
      await render()
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromContext(ScoreBoard.stuff))
   })

   function doSomething() {
      fetch('...')
         .then((res) => fetch('...' + res))
   }

   async function doSomething() {
      const res = await fetch('...')
      await fetch('...' + res)
   }

   async function doSomething() {
      try {
         await span(o => fetch('...'))
         await span(o => fetch('...' + o.data))
      }
      catch (err) {

      }
   }

}

useEffect(() => {
   const chatroom = createConnection(serverUrl, roomId);
   chatroom.connect();
   return () => {
      chatroom.disconnect();
   };
}, [serverUrl, roomId]);


trackEffect(({ setup }) => {
   const chatroom = createConnection($serverURL, $roomID)
   setup(() =>
      chatroom.connect()
   ).cleanup(() =>
      chatroom.disconnect()
   )
})

useEffect(() => {
   function handleMove(e) {
      setPosition({ x: e.clientX, y: e.clientY });
   }
   window.addEventListener('pointermove', handleMove);
   return () => {
      window.removeEventListener('pointermove', handleMove);
   };
}, []);

trackEffect(({ setup }) => {
   function handleMove(e) {
      setPosition({ x: e.clientX, y: e.clientY });
   }
   setup(() =>
      window.addEventListener('pointermove', handleMove)
   ).cleanup(() =>
      window.removeEventListener('pointermove', handleMove)
   )
})

useEffect(() => {
   const animation = new FadeInAnimation(ref.current);
   animation.start(1000);
   return () => {
      animation.stop();
   };
}, []);

trackEffect(({ setup }) => {
   const animation = new FadeInAnimation($div())
   setup(() =>
      animation.start(100)
   ).cleanup(() =>
      animation.stop
   )
})


useEffect(() => {
   const div = ref.current;
   const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting) {
         document.body.style.backgroundColor = 'black';
         document.body.style.color = 'white';
      } else {
         document.body.style.backgroundColor = 'white';
         document.body.style.color = 'black';
      }
   }, { threshold: 1.0 });

   observer.observe(div);
   return () => {
      observer.disconnect();
   }
}, []);


trackEffect(({ setup }) => {
   const div = $div();
   const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting) {
         document.body.style.backgroundColor = 'black';
         document.body.style.color = 'white';
      } else {
         document.body.style.backgroundColor = 'white';
         document.body.style.color = 'black';
      }
   }, { threshold: 1.0 });

   setup((observer.observe(div)))
      .cleanup((observer.disconnect))
})

useEffect(() => {
   let ignore = false;
   setBio(null);
   fetchBio(person).then(result => {
      if (!ignore) {
         setBio(result);
      }
   });
   return () => {
      ignore = true;
   }
}, [person]);

trackEffect(({ setup, ooo }) => {
   let ignore = false;
   mu($bio).value = null
   setup(() => {
      ooo.await(fetchBio(person), result => {
         if (ignore) return;
         mu($bio).value = result
      })
   }).cleanup(() => ignore = true)
})

trackEffect(({ setup, ooo }) => {
   let ignore = false;
   mu($bio).value = null
   setup(() => {
      fetchBio(person).then(result => {
         if (ignore) return;
         mu($bio).value = result
      })
   }).cleanup(() => ignore = true)
})

// NOTE: ooo is only needed if you want to stack awaits, especially to distinguish action promises from scheduling promises
// ... maybe only relevant in sync effects? Is it relevant with trackEffect??

trackEffect(({ ooo, abort }) => {
   mu($bio).value = null

   ooo.await(fetchBio(person, { abort }))
      .then(result => {
         mu($bio).value = result
      })
      .catch(err => {
         console.error(err.message)
      })
})

trackEffect(({ abort }) => {
   mu($bio).value = null

   fetchBio(person, { abort })
      .then(result => {
         mu($bio).value = result
      })
      .catch(err => {
         console.error(err.message)
      })
})

trackEffect(async ({ abort }) => {
   mu($bio).value = null
   try {
      const result = await fetchBio(person, { abort })
      mu($bio).value = result
   }
   catch (err) {
      console.error(err.message)
   }
})

trackEffect(async ({ abort }) => {
   mu($bio).value = null
   const [result, error] = await fetchBio(person, { abort })
   if (err) {
      console.error(err.message)
   }
   else {
      mu($bio).value = result
   }
})

trackEffect(({ setup }) => {
   let abort = false;
   mu($bio).value = null
   setup(async () => {
      const result = await fetchBio(person)
      if (abort) return;
      mu($bio).value = result
   }).cleanup(() => abort = true)
})

queueIonicRenderTask(({ ooo, tether, setup }) => {
   setup((count = 0) =>
      setInterval(tether(() => {
         count++
         console.log("hi", count)
      }), 500)
   ).cleanup(clearInterval)

   ooo.await(render, () => {
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromContext(ScoreBoard.stuff))
   })
})

queueIonicRenderTask(({ ooo, tether, setup }) => {
   setup((count = 0) =>
      setInterval(tether(() => {
         count++
         console.log("hi", count)
      }), 500)
   ).cleanup(clearInterval)

   ooo.await(render, () => {
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromContext(ScoreBoard.stuff))
   })
})

ionicRenderTask(async ({ span, spot, tether, setup }) => {
   setup((count = 0) =>
      setInterval(tethered(() => {
         count++
         console.log("hi", count)
      }), 500)
   ).cleanup(clearInterval)
   const res = await render()
   tether(() => {
      if (res.error) {
         $error.value = res.error
         return;
      }
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromContext(ScoreBoard.stuff))
   })
})

ionicRenderTask(async ({ span, spot, tether, setup }) => {
   setup((count = 0) =>
      setInterval(tethered(() => {
         count++
         console.log("hi", count)
      }), 500)
   ).cleanup(clearInterval)
   const res = await render()
   if (res.error) {
      $error.value = res.error
      return;
   }
   const { } = useSelection(x, y)
   const newTodo = IonicTodo(todo)
   console.log('other stuff', fromContext(ScoreBoard.stuff))
})

// ionicRenderTask(async o => {
//    o.setup((count = 0) =>
//       setInterval(() => o.tether(() => {
//          count++
//          console.log("hi", count)
//       }), 500)
//    ).cleanup(clearInterval)
//    await o.span(render())
//    await o.spot(res => {
//       if (res.error) {
//          $error.value = res.error
//          return;
//       }
//       const { } = useSelection(x, y)
//       const newTodo = IonicTodo(todo)
//       console.log('other stuff', fromContext(ScoreBoard.stuff))
//    })
// })

ionicPostTask(async ({ setup, useSelection, IonicTodo }) => {
   setup((count = 0) =>
      setInterval(() => {
         count++
         console.log("hi", count)
      }, 500)
   ).cleanup(clearInterval)

   await render()
   const { } = useSelection(x, y)
   const newTodo = IonicTodo(todo)
   console.log('other stuff', fromContext(ScoreBoard.stuff))

}, { contextualize: { useSelection, IonicTodo } })


return ;
}

type CleanupFn<T> = (...values: T | [undefined]) => void


function Setup() {

   const flask = getActiveFlask()

   return function setup<T>(setupFn: () => T) {
      let stub = setupFn()
      flask.beforeRemount(() => stub = setupFn)
      return {
         cleanup(cleanUp?: (stub: T) => void) {
            if (cleanUp) {
               flask.beforeDemount(() => cleanUp(stub))
               flask.onDiscard(() => cleanUp(stub))
            }
            else {
               if (!(stub instanceof Function) || stub.length !== 0)
                  throw new Error('Must provide a cleanup function that expects no arguments')
               flask.beforeDemount(stub)
               flask.onDiscard(stub)
            }
         }
      }
   }
}


setup(() =>
   setInterval(() => {
      console.log("hi")
   }, 500)
).cleanup(clearInterval)