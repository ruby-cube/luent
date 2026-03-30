import { template, For, FromTag, Style, css } from "@rue/lumo";
import { as, EACH, Ion, Ionic, queuePrelude, queueRender, queueTask } from "@rue/quarky";
import './TestListTransit.css'

// Modified Demo from Svelte
type Todo = {
   id: number;
   done: boolean;
   description: string;
}

export function TestListTransit() {

   const $todos = Ion(Ionic([
      { id: 1, done: false, description: 'write some docs' },
      { id: 2, done: false, description: 'start writing blog post' },
      { id: 3, done: true, description: 'buy some milk' },
      { id: 4, done: false, description: 'mow the lawn' },
      { id: 5, done: false, description: 'feed the turtle' },
      { id: 6, done: false, description: 'fix some bugs' }
   ], { [EACH]: as(Ionic) }));

   let uid = $todos().length + 1;

   function remove(todo: Ionic<Todo>) {
      const index = $todos().indexOf(todo);
      $todos().splice(index, 1);
   }

   return template(
      <div class="board">
         <input
            placeholder="what needs to be done?"
            on:keydown={(e) => {
               if (e.key !== 'Enter') return;

               $todos().push(Ionic({
                  id: uid++,
                  done: false,
                  description: e.currentTarget.value
               }));

               e.currentTarget.value = '';
            }}
         />

         <div class="todo">
            <h2>todo</h2>
            <TodoList todos={($todos().filter((t) => !t.done))} remove={remove} />
         </div>

         <div class="done">
            <h2>done</h2>
            <TodoList todos={($todos().filter((t) => t.done))} remove={remove} />
         </div>
      </div>
   )
      .style(css`
         .board {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-column-gap: 1em;
            max-width: 36em;
            margin: 0 auto;
         }

         .board > input {
            font-size: 1.4em;
            grid-column: 1/3;
            padding: 0.5em;
            margin: 0 0 1rem 0;
         }

         h2 {
            font-size: 2em;
            font-weight: 200;
         }

         .transition-position {
            transition: transform 150ms ease-in-out;
         }
      `)
}



const sent = new Map()

function send(id: number, node: HTMLElement) {
   const rect = node.getBoundingClientRect()
   sent.set(id, rect)
}

function receive(id: number, node: HTMLElement) {
   const first = sent.get(id)
   if (first) {
      const last = node.getBoundingClientRect()
      queueRender(() => {
         const deltaY = first.top - last.top
         const deltaX = first.left - last.left
         if (deltaY || deltaX) {
            node.style.setProperty('transform', `translate(${deltaX}px, ${deltaY}px)`)
            console.log('DELTA', 56)
            requestAnimationFrame(() => {
               queueTask(() => {
                  node.classList.add('transition-position')
                  node.style.setProperty('transform', `translate(${0}px, ${0}px)`)
                  node.addEventListener('transitionend', () => {
                     console.log('transition end')
                     node.classList.remove('transition-position')
                     node.style.removeProperty('transform')
                  })
               })
            })
         }
      })
   }
}



function TodoList(input: FromTag<{
   todos: Ion<Ionic<Todo>[]>,
   // 'can:remove': (todo: Ionic<Todo>) => void
   remove: (todo: Ionic<Todo>) => void
}>) {
   const {ætodos, remove } = input

   const lis: HTMLElement[] = []

   return template(
      <ul class="todos">
         {For(ætodos, t => t.id, (todo, $i) => (
            <li
               transit-key={todo.id}
               animate-item
               class={(todo.done && 'done')}
               ref={{ arr: lis, i: $i }}
            >
               <label>
                  <input type="checkbox" mu:checked={todo.ædone} />
                  <span>{todo.description}</span>
                  <button on:click={() => remove(todo)} aria-label="Remove">X</button>
               </label>
            </li>
         ))}
      </ul>
   )
      .style(css`
   	   label {
         	width: 100%;
         	height: 100%;
         	display: flex;
         }

         span {
         	flex: 1;
         }

         button {
            border: none;
            background-color: transparent
         }

         .transition-item {
            transition: transform 250ms ease-in-out;
         }
      `)
}





