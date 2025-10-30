//@ts-nocheck

import { component } from "@rue/lumo"
import { Meanwhile } from "../../../../packages/lumo/src/boundaries/Await"
import { doAction } from "../../../../packages/quarky/src/action/Action"

// AsyncOp() is about managing and coordinating async operations
// - it batches updates across async scopes


// render() is about scheduling of rendering, can also batch
// - renders can be canceled

// render types: idle | default (idle w 17ms deadline) | swift (next rAF)

// idleRender()
// render()
// swiftRender()
// animate()


ooo.await(phase.prerender, () => {

})
ooo.await(phase.render, () => {

})
ooo.await(cycle.tick, () => {

})


function TodoWithSuspense() {

   // Suspense
   const toggleComplete = Action(({ ooo }) => () => {
      mu(todo).complete = !todo.complete

      ooo.await((dispatch('...', todo.complete)))
   }, { await: true })

   return component(
      <div>
         {Await(toggleComplete)}
         {Meanwhile(
            <>loading...</>
         )}
         {Then(
            <>
               {If(todo.$complete,
                  <p on:click={toggleComplete}>[x]</p>
               )}
               {Else(
                  <p on:click={toggleComplete}>[ ]</p>
               )}
            </>
         )}
      </div>
   )
}

class Animal {
   readonly something = 0

   /*reined*/ value = 0

   /*pure*/ isSomething() {

   }

   private doSomething() {

   }
}

const markComplete = Action(({ ooo }) => () => {
   mu: const something = todo.complete = true

   ooo.await(cycle.tick)
   ooo.await((dispatch('...')))
}, {
   '@race'(rival) {
      if (rival.is('markComplete') && rival.precedes(this))
         rival.cancel()
      else this.cancel()
   },
   catch(err) { },
   tags: ['markComplete'],
   lazy: { limit: 100 },
   await: true
})

// TODO: how to return output of an action?
const todo = Ionic(data, todo => ({
   markComplete: Action(function () {
      const output = todo.markComplete()
      this.await(db.dispatch('...'))
      return this.await(() => output)
   })
}))

//TODO: canceling action vs canceling dispatches are two different things
const todo = Ionic(data, todo => ({
   markComplete: Action({
      do: () => todo.markComplete(),
      dispatch() {
         this.await(db.dispatch('...'))
      }
   })
}))

// {
//    action: true,
//    '@'() {
//       this.await(tick) // If "this" is the action, how do we access the todo?
//       this.await((dispatch('...')))
//    }
// }

function IonicTodo(data: Todo) {

}

function Todo() {

   const $todos = fetchTodos()

   const $articles = AsyncIon({
      initial: [] as Article[],
      fetch: () => db.fetchArticles($searchTerm(), { debounce: 100 })
   })

   const $articles = AsyncIon(() => asIonicArticles(db.fetchArticles($searchTerm(), { debounce: 100 })))

   // Optimistic
   const markComplete = AsyncAction(({ ooo }) => function () {
      mu: todo.complete = true

      ooo.await(tick)
      ooo.await((db.dispatch('...')))
         .catch(err => { this.retry() })
         .catch(err => { this.rollback() })
   })

   return component(
      <>
         {Await(suspense)}
         {Meanwhile(
            <p>loading...</p>
         )}
         {Catch((err, retry) =>
            <Error msg={err.message} on:click={retry}></Error>
         )}
         {Then(
            <Article></Article>
         )}


         {Try(

         )}
         {Catch((error, action) => (
            <>
               <p>Error: {error}</p>
               {If(action,
                  <>
                     <button on:click={action.retry()}>retry</button>
                     <button on:click={action.rollback()}>rollback</button>
                  </>
               )}
            </>
         ))}

         {If(markComplete.error,
            <>
               <p>Error: {todo.markComplete.error}</p>
               <button on:click={todo.markComplete.retry()}>retry</button>
               <button on:click={todo.markComplete.rollback()}>rollback</button>
            </>
         )}
      </>
   )
}


// await phase.prerender(() => {

// })
// await phase.render(() => {

// })
// await cycle.tick(() => {

// }) // TODO: How do I distinguish an action's await from a render cycle's await...

runIonicTask() // sync
queueIonicPrerendertask()
queueIonicRenderTask()
queueIonicTask() // postrender

watch($count, () => {
   // synchronous to action
})

watch($count, async ({ span, sync }) => {
   // synchronous to action
   await span(dispatch('...'))
   await sync(() => {
      // async part of action
   })
}).then(async () => {
   // microtasks after action complete
   await phase.render(() => {

   })
})

watch($count, async () => {
   await dispatch('...')

}).then(async () => {

   await phase.render(() => {

   })
})


watch($count, async () => {
   await dispatch('...')

}).then(() => {

})

watch($count)
   .sync(async ({ span }) => {
      doSomething()

      await span(() => dispatch('...'))
      await sync(() => {

      })
   })
   .then(() => {

   })

watch($count)
   .sync(() => doSomething())
   .span(() => dispatch('...'))
   .sync(() => { })
   .prerender(() => { })
   .render(() => { })
   .tick(() => { })

// watch($count, o => { // as an effect (compare below)
//    doSomething()

//    o.await(dispatch('...'), () => {

//     })
//    o.prerender(() => { 

//    })
//    o.render(() => { 

//    })
//    o.tick(() => {

//     })
// })



// watch($count, sync(o => { // as an effect (compare below)
//    doSomething()

//    o.await(dispatch('...'), () => {

//    })
//    o.await(prerender, () => {

//    })
//    o.await(render, () => {

//    })
//    o.await(tick, () => {

//    })
// }))



// watch($count, ooo => { // as an effect (compare below)
//    doSomething()

//    ooo.await(dispatch('...'), () => {

//    })
//    ooo.prerender(() => {

//    })
//    ooo.render(() => {

//    })
//    ooo.tick(() => {

//    })
// })


watch($count, sync(ooo => { // as an effect (compare below)
   doSomething()

   ooo.await(dispatch('...'), () => {

   })
   ooo.await($prerender, () => {

   })
   ooo.await($render, () => {

   })
   ooo.await($tick, () => {

   })
}))

watch($count, sync(o => { // as an effect (compare below)
   doSomething()

   o.await(dispatch('...'), () => { })
   o.await($prerender, () => { })
   o.await($render, () => { })
   o.await($tick, () => { })
}))




watch($count, sync(o => { // as an effect (compare below)
   doSomething()

   o.await(dispatch('...'), () => {
      doSomething()
   })
   o.await.prerender(() => {

   })
   o.await.render(() => {

   })
   o.await.tick(() => {

   })
}))

watch($count, render(o => {
   doSomething()

   o.await.tick(() => {

   })
}))

watch($count, render(o => {
   doSomething()

   o.await(tick(), () => {

   })
}))

watch($count, render(o => {
   doSomething()

   o.await($tick, () => {

   })
}))

watch($count, render(o => {
   doSomething()

   o.awaitTick(() => {

   })
}))

watch($count, sync(o => { // as an effect (compare below)
   doSomething()

   o.await(dispatch('...'), () => {

   })
   o.await($prerender, () => {

   })
   o.await($render, () => {

   })
   o.await($tick, () => {

   })
}))


// watch($count, sync(ooo => { // as an effect (compare below)
//    doSomething()

//    ooo.await(dispatch('...'), () => {

//    })
//    ooo.awaitPrerender(() => { })
//    ooo.awaitRender(() => { })
//    ooo.awaitTick(() => { })
// }))



// WINNER
watch($count, sync(({ ooo }) => { // as an effect (compare below)
   doSomething()

   ooo.await((dispatch('...')), o => {
      doSomething()
   })
   ooo.await(prerender, o => {
      console.log('something')
   })
   ooo.await(render, o => {
      doSomething()
   })
      .catch(err => {
         console.error(err.message)
      })
   ooo.await(tick, o => {
      console.log('something')
   })
   ooo.await((dispatch('...')), o => {
      console.log('something')
   })
   ooo.catch(err => {
      console.error(err.message)
   })
}))

watch($count, sync(({ ooo }) => { // as an effect (compare below)
   doSomething()

   ooo.await((dispatch('...')))
      .then(o => {
         doSomething()
      })
      .catch(err => {
         console.error(err.message)
      })
   ooo.await(prerender, () => {
      console.log('something')
   })
   ooo.await(render, () => {
      doSomething()
   })
   ooo.await(tick, () => {
      console.log('something')
   })
   ooo.await((dispatch('...')))
      .then(o => {
         console.log('something')
      })
   ooo.catch(err => {
      console.error(err.message)
   })
}))

runIonicTask(({ ooo }) => {

   ooo.await(PRERENDER, () => {

   })
}) // sync
queueIonicPrerendertask()
queueIonicRenderTask()
queueIonicTask() // postrender

// watch($count, ooo => { // QUESTION: should this be a setup function or an effect?? Here, it is a setup function
//    ooo.run(() => {
//       doSomething()
//    })
//    ooo.await(dispatch('...'), () => {

//    })
//    ooo.await(prerender, () => {

//    })
//    ooo.await(render, () => {

//    })
//    ooo.await(tick, () => {

//    })
// })


watch($count).sync(ooo => {
   doSomething()

   ooo.span(() => dispatch('...'))
   ooo.sync(() => { })
   ooo.prerender(() => { })
   ooo.render(() => { })
   ooo.tick(() => { })
})

watch($count).prerender(() => {
   // microtask
})

watch($count, ooo => {
   // NOTE: this will run on every change!
   ooo.prerender(() => {

   })
})


watch($count).render(() => {

})

watch($count).tick(() => {

})



// watch($count, {
//    [then()]() {

//    },
//    [then()]() {

//    }
// }


// task/event/tick
//  - action
//  --- sync effects
//  --- microtask effects
//  - micro
//  - render
//  --- layout
// tick
//  - action
//  - micro
//  - render
//  --- layout





e => markComplete(todo)

   (
      <>
         {Await(markComplete,
            <>hi</>
         )}
         {Meanwhile(
            <>loading...</>
         )}
         {Catch(err => (
            <>{err}</>
         ))}
      </>
   )

function markComplete(todo) {
   todo.complete = true
}

e => action(() => {
   markComplete(todo)
},)

const $todos = SuspenseIon({
   initial: undefined,
   fetch: () => db.fetchTodos().then(todos => IonicTodoArray(todos)),
   '@init'() {

   },
   async '@set'(value) { // This is an action... how do we batch the promises?
      await db.setTodos(value)
   },
   standin: () => { }
}, {
   addTodo(todo: $$Todo) {
      this.value.push(todo) // optimistic update
   },

   removeTodo(todo: $$Todo) {
      this.value.splice(this.value.indexOf(todo), 1)
   },

   removeCompleted() {
      this.value = this.value.filter(todo => !todo.completed)
   },

   setCompleteForEach(completed: boolean) {
      this.value.forEach((todo) => (todo.completed = completed))
   },

   isAllComplete() {

   },

   '~pure'() {
      return ['isAllComplete']
   },

   async '@addTodo'(todo: Todo) { // TODO: auto mark stale and unstale 
      await db.addTodo(todo)
   },

   '@removeTodo'(todo: $$Todo) {
      // this.value.splice(this.value.indexOf(todo), 1)
   },

   '@removeCompleted'() {
      // this.value = this.value.filter(todo => !todo.completed)
   },

   '@setCompleteForEach'(completed: boolean) {
      // this.value.forEach((todo) => (todo.completed = completed))
   },
})