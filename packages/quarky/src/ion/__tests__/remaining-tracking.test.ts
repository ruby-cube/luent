// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { Ion, Ionic, as, EACH } from '../../index'
import { quarkOf } from '../../abstract/Quark'

type Todo = {
   id: number
   title: string
   completed: boolean
}

const ionicTodos = (todos: Todo[]) => Ionic(todos, { [EACH]: as(Ionic) })

describe('remaining tracking', () => {
   it('keeps tracking every todo.completed after toggle-all on then off', () => {
      const todos = ionicTodos([
         { id: 1, title: 'a', completed: false },
         { id: 2, title: 'b', completed: true },
         { id: 3, title: 'c', completed: false },
      ])

      ;(quarkOf(todos) as any).asTraceable = { name: 'todos', origin: undefined }

      const remaining = Ion(() => todos.filter(todo => !todo.completed).length)

      expect(remaining()).toBe(2)

      todos.forEach(todo => {
         todo.completed = true
      })
      expect(remaining()).toBe(0)

      todos.forEach(todo => {
         todo.completed = false
      })
      expect(remaining()).toBe(3)

      todos[1].completed = true
      expect(remaining()).toBe(2)

      todos[1].completed = false
      expect(remaining()).toBe(3)

      todos[2].completed = true
      expect(remaining()).toBe(2)
   })
})