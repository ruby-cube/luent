import { Ionic, ionic } from "luent";

function TestIonic() {
  const todos = ionic(['a'])

  function doSomething(todos: Ionic<string[]>) {

  }

  doSomething(todos)

  //@ts-expect-error
  doSomething(['b'])
}