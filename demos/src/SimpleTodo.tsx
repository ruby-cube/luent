import { $from, $of, component, Else, For, If } from "luent";
import { ion, ionic, watch } from "@luent/quarky";

let id = 0
function genUID() {
  return id++
}

class Item {
  id = genUID()
  completed = false
  constructor(
    public text: string
  ) {
  }
}


export function BulletJournal() {

  const list = ionic([new Item('Learn Luent')] as Item[], {
    '-capsule': true,
    insert(item: Item, index: number) {
      this.splice(index, 0, item)
    },
    remove(index: number) {
      return this.splice(index, 1)[0]
    },
    appendNew() {
      const item = new Item('')
      this.push(item)
      return item
    }
  })

  const $activeTodo = ion(null as Item | null)

  function reKeyup(event: KeyboardEvent, item: Item, index: number) {
    console.log('event.key', event.key)
    if (event.key === 'Enter') {
      $activeTodo.value = null;
      return;
    }
    if (event.key === 'Delete') {
      list.remove(index)
      $activeTodo.value = list[index] ?? list.appendNew()
      return;
    }
    if (event.key === 'Space' && event.metaKey) {
      item.completed = !item.completed
    }
  }

  watch($activeTodo, () => {
    console.log('@@@ active todo', $activeTodo())
  })

  return (

    <ul on:click={e => e.from('li', 'input') || $activeTodo() && ($activeTodo.value = null)}>
      {For(list, m => m.id, (item, index) =>
        <li on:click={e => $activeTodo() || ($activeTodo.value = item)}>
          {If(() => item === $activeTodo(), () =>
            <input
              type='text'
              on:keyup={e => reKeyup(e, item, index())}
              mu:value={$of(item).text}
            />
          )}
          {Else(
            <>{$of(item).text}</>
          )}
        </li>
      )}
    </ul>
  )
}

function byId(item: any) {
  return item.id
}