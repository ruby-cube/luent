//@ts-nocheck
import { component } from "@rue/lumo"
import { Ion } from "@rue/quarky"

type Todo = {
   text: string
   completed: boolean
}

class Todos {
   constructor(public value: Todo[]) { }

   addTodo(todo: Todo) {
      return true
   }

   removeTodo(index: number) {
      return 0
   }

   hop() { }
}

const PROTO = Symbol('proto')

// TODO:
// 1) proto
// 2) method overrides
// 3) extensions
// 4) hooks
// - access to this/super

// function extend<P, C extends { prototype: any }>(parent: P, constructor: C): P & C['prototype'] {
//    return Object.create(Object.getPrototypeOf(parent), Object.assign(Object.getOwnPropertyDescriptors(parent), Object.getOwnPropertyDescriptors(constructor.prototype)))
// }
// const obj = extend([] as Todo[], Todos)


const todos = Pion([] as Todo[], {

   push: Action((todo: Todo) => via(Array, todos).push(todo)),

   addTodo: Action((todo: Todo) => {
      via(Todos, todos).addTodo(todo)
   }),

   // author: nest(IonicProfile),

   '@removeTodo'() {

   },

   doMore() {
      return 'hi'
   }
})




function via<T, C extends { prototype: any }>(constructor: C, obj: T): C['prototype'] {
   return new Proxy(todos, {
      get() {

      }
   })
}


// todos.addTodo()

function Pion<T, C, P>(obj: T, proto: P & ThisType<{ value: T } & P>): (() => T) & { value: T } & Omit<C, keyof P> & P {
   return () => obj
}

function Ionizer<T, P>(obj: T, proto: (_super: T) => P & ThisType<Omit<T, keyof P> & P>): T & P {
   return { ...obj, ...proto }
}

function Action<F>(fn: F) {
   return fn
}

const what = { ...Todos.prototype }

// function Folder() {
//    return component(
//       <>
//          <div on:click=`e => doSomething` class=`{ active: $active }` style=`($store() + 1)` enabled="true">{$text}</div>

//          <div on:click={e => doSomething} class={{ active: $active }} style={($store() + 1)} enabled="true">{$text}</div>
//       </>
//    )
// }





