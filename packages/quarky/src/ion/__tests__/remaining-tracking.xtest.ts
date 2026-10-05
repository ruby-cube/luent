// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { quarkOf } from '../../abstract/Quark'
import { EACH, ionic } from '../../ionic/Ionic'
import { ion } from '../Ion'

type Todo = {
   id: number
   title: string
   completed: boolean
}

const ionicTodos = (todos: Todo[]) => ionic(todos, { [EACH]: { '-as': ionic } })

describe('remaining tracking', () => {
   it('keeps tracking every todo.completed after toggle-all on then off', () => {
      const todos = ionicTodos([
         { id: 1, title: 'a', completed: false },
         { id: 2, title: 'b', completed: true },
         { id: 3, title: 'c', completed: false },
      ])

      ;(quarkOf(todos) as any).asTraceable = { name: 'todos', origin: undefined }

      const remaining = ion(() => todos.filter(todo => !todo.completed).length)

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