//@ts-nocheck

import { template } from "@rue/lumo"
import { Meanwhile } from "../../../../packages/lumo/src/boundaries/Await"
import { doAction } from "../../../../packages/x-old/x_action/Action"

// Action() is about managing and coordinating async operations
// - it batches updates across async scopes

// Actions are about user intention, outermost action is considered the action
// - used for logging actions in development
// - history and undo-redo
// - rollback and cancellation
// - conflict resolution


// update() is about scheduling of effects, can also batch
// - updates can be canceled

// render types: idle | swift (idle w 17ms deadline) | instant (within task, potential to be render blocking) | animate / frameUpdate (next rAF)

// dispatch()
// swiftUpdate()
// instantUpdate()
// animate / celUpdate()


ooo.await(phase.prelude, () => {

})
ooo.await(phase.render, () => {

})
ooo.await(cycle.tick, () => {

})


// fetch
// retreive
// request('GET')

// dispatch

// transmit
// relay

request


function TodoWithSuspense() {

   const toggleComplete = Action(({ ooo }) => () => {
      todo.complete = !todo.complete

      ooo.await(dispatch('...', todo.complete))
   })

   return template(
      <div>
         Hello `'20%'` of people
         % '1%'
         % (3 % 1)
         % Await(toggleComplete)
         % Meanwhile(
         <>loading...</>
         )
         % Then(
         % If(todo.$complete,
         <p on:click='toggleComplete'>[x]</p>
         )
         % Else(
         <p on:click='toggleComplete'>[ ]</p>
         )
         )
      </div>
   )
}



const markComplete = Action(({ ooo }) => () => {
   const something = todo.complete = true

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
   idle: { due: 100 },
   suspense: true
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
      presume: () => todo.markComplete(),
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

// [ ] await load only vs refetches
// [ ] await remoteIons within render
// [ ] await promise
// [ ] coordinating 'suspense'



function Todo() {

   const $todos = fetchTodos()

   const $articles = RemoteIon({
      initial: [] as Article[],
      fetch: () => db.fetchArticles($searchTerm(), { debounce: 100 })
   })

   const $articles = RemoteIon(() => asIonicArticles(db.fetchArticles($searchTerm(), { debounce: 100 })))

   // Optimistic
   const markComplete = RemoteAction(() => {
      todo.complete = true

      ooo.await(tick)
      ooo.await((db.dispatch('...')))
         .catch(err => { this.retry() })
         .catch(err => { this.rollback() })
   })

   return template(
      <>
         {Await(
            <Article></Article>
         )}
         {Meanwhile(
            <p>loading...</p>
         )}
         {Catch((err, retry) =>
            <Error msg={err.message} on:click={retry}></Error>
         )}

         {Await([$cities, $stories,
            <Article></Article>
         ])}
         {Meanwhile(
            <p>loading...</p>
         )}
         {Catch((err, retry) =>
            <Error msg={err.message} on:click={retry}></Error>
         )}

         {Await($cities,
            <Article></Article>
         )}
         {Meanwhile(
            <p>loading...</p>
         )}
         {Catch((err, retry) =>
            <Error msg={err.message} on:click={retry}></Error>
         )}

         {Await($cities)} {Then(
            <Article></Article>
         )}
         {Meanwhile(
            <p>loading...</p>
         )}
         {Catch((err, retry) =>
            <Error msg={err.message} on:click={retry}></Error>
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


// await phase.prelude(() => {

// })
// await phase.render(() => {

// })
// await cycle.tick(() => {

// }) // TODO: How do I distinguish an action's await from a render cycle's await...

runIonicTask() // sync
queueIonicPrerendertask()
queueIonicRenderTask()
queueIonicTask() // postlude

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
   .prelude(() => { })
   .render(() => { })
   .tick(() => { })

// watch($count, o => { // as an effect (compare below)
//    doSomething()

//    o.await(dispatch('...'), () => {

//     })
//    o.prelude(() => { 

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
//    o.await(prelude, () => {

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
//    ooo.prelude(() => {

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
   ooo.await(prelude, () => {

   })
   ooo.await(renderphase, () => {

   })
   ooo.await(tick, () => {

   })
}))

watch($count, sync(o => { // as an effect (compare below)
   doSomething()

   o.await(dispatch('...'), () => { })
   o.await(prelude, () => { })
   o.await(renderphase, () => { })
   o.await(tick, () => { })
}))




watch($count, sync(o => { // as an effect (compare below)
   doSomething()

   o.await(dispatch('...'), () => {
      doSomething()
   })
   o.await.prelude(() => {

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

   o.await(tick, () => {

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
   o.await(prelude, () => {

   })
   o.await(renderphase, () => {

   })
   o.await(tick, () => {

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
   ooo.await(prelude, o => {
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
   ooo.await(prelude, () => {
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

   ooo.await(PRELUDE, () => {

   })
}) // sync
queueIonicPrerendertask()
queueIonicRenderTask()
queueIonicTask() // postlude

// watch($count, ooo => { // QUESTION: should this be a setup function or an effect?? Here, it is a setup function
//    ooo.run(() => {
//       doSomething()
//    })
//    ooo.await(dispatch('...'), () => {

//    })
//    ooo.await(prelude, () => {

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
   ooo.prelude(() => { })
   ooo.render(() => { })
   ooo.tick(() => { })
})

watch($count).prelude(() => {
   // microtask
})

watch($count, ooo => {
   // NOTE: this will run on every change!
   ooo.prelude(() => {

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

const $todos = AsyncIon({
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