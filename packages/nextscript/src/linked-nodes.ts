export interface LinkedList {
  head?: LinkedNode | null
  tail?: LinkedNode | null
}

export interface LinkedNode {
  next?: LinkedNode | null
  prev?: LinkedNode | null
  removed?: boolean
}

export function toLinkedList<T extends LinkedNode>(array: T[]) {
  const list: LinkedList = { head: array[0], tail: array.at(-1) }
  let prev: LinkedNode | null = null
  for (const item of array) {
    item.removed = false;
    if (prev) prev.next = item
    item.prev = prev
    prev = item
  }
  return list
}



