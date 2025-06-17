//@ts-nocheck

const todos = [{
   id: 0,
   description: 'get on tv',
   complete: false
}]

// updating nested property
$todos.state = set($todos(), 1, 'description').to('clean floor')

$todos.state = $todos().set(1, 'description').to('clean floor')

$todos()[1].description = 'clean floor'

//
$todos.state = [
   ...$todos(),
   {
      id: genId(),
      description: 'new todo',
      complete: false
   }
]

$todos.state = $todos()
   .append({
      id: genId(),
      description: 'new todo',
      complete: false
   })
   .set(2, 'description').to('play')
   .set(2, 'complete').to(true)


const $todos = ion.immu([])