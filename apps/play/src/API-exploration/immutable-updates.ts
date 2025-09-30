//@ts-nocheck

const todos = [{
   id: 0,
   description: 'get on tv',
   complete: false
}]

// updating nested property
$todos.value = set($todos(), 1, 'description').to('clean floor')

$todos.value = $todos().set(1, 'description').to('clean floor')

$todos()[1].description = 'clean floor'

//
$todos.value = [
   ...$todos(),
   {
      id: genId(),
      description: 'new todo',
      complete: false
   }
]

$todos.value = $todos()
   .append({
      id: genId(),
      description: 'new todo',
      complete: false
   })
   .set(2, 'description').to('play')
   .set(2, 'complete').to(true)


const $todos = ion.immu([])