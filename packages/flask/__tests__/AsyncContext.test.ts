import { describe, expect, it, test } from "vitest"
import { $_run_with_, $_snap_context, AsyncState } from "../src/context/AsyncContext"

describe('async context', () => {
   test('AsyncState', () => {

      const APPLE = 'apple'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)

      const appleValue = ':)'

      function renderWithApple() {
         const apple = getActiveApple()
         expect(apple).toBe(appleValue)
      }

      function renderWithoutApple() {
         const apple = getActiveApple()
         expect(apple).toBeFalsy()
      }

      renderWithoutApple()
      appleStack.push(appleValue)
      renderWithApple();
      appleStack.pop()
      renderWithoutApple()
   })

   test.skip('$_snap_context', () => {

      const APPLE = 'apple'
      const PEACH = 'peach'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)
      const [getActivePeach, peachStack] = AsyncState<string>(PEACH)

      const appleValue = ':)'
      const peachValue = '<3'

      function renderWithFruit() {
         const context = $_snap_context()
         expect(context[APPLE]).toBe(appleValue)
         expect(context[PEACH]).toBe(peachValue)
      }

      function renderWithoutFruit() {
         const context = $_snap_context()
         expect(context[APPLE]).toBeFalsy()
         expect(context[PEACH]).toBeFalsy()
      }

      renderWithoutFruit()
      appleStack.push(appleValue)
      peachStack.push(peachValue)
      renderWithFruit();
      appleStack.pop()
      peachStack.pop()
      renderWithoutFruit()
   })


   test.skip('$_run_with', () => {

      const APPLE = 'apple'
      const PEACH = 'peach'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)
      const [getActivePeach, peachStack] = AsyncState<string>(PEACH)

      const appleValue = ':)'
      const peachValue = '<3'
      let context: any;

      function renderWithFruit() {
         context = $_snap_context()
         expect(context[APPLE]).toBe(appleValue)
         expect(context[PEACH]).toBe(peachValue)
      }

      function renderWithoutFruit() {
         const context = $_snap_context()
         expect(context[APPLE]).toBeFalsy()
         expect(context[PEACH]).toBeFalsy()
      }

      function renderAsyncWithFruit() {
         const apple = getActiveApple()
         const peach = getActivePeach()
         expect(apple).toBe(appleValue)
         expect(peach).toBe(peachValue)
      }

      renderWithoutFruit()
      appleStack.push(appleValue)
      peachStack.push(peachValue)
      renderWithFruit();
      appleStack.pop()
      peachStack.pop()
      renderWithoutFruit()

      $_run_with_(context, renderAsyncWithFruit)
   })



   test.skip('$_run_with and add to context', () => {

      const APPLE = 'apple'
      const PEACH = 'peach'
      const THUMB = 'thumb'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)
      const [getActivePeach, peachStack] = AsyncState<string>(PEACH)
      const [getActiveThumb, thumbStack] = AsyncState<string>(THUMB)

      const appleValue = ':)'
      const peachValue = '<3'
      const thumbValue = ';]'

      let context: any

      function renderWithFruit() {
         context = $_snap_context()
         expect(context[APPLE]).toBe(appleValue)
         expect(context[PEACH]).toBe(peachValue)
      }

      function renderWithoutFruit() {
         const context = $_snap_context()
         expect(context[APPLE]).toBeFalsy()
         expect(context[PEACH]).toBeFalsy()
      }

      function renderAsyncWithFruit() {
         const apple = getActiveApple()
         const peach = getActivePeach()
         const thumb = getActiveThumb()
         expect(apple).toBe(appleValue)
         expect(peach).toBe(peachValue)
         expect(thumb).toBe(thumbValue)

         const context = $_snap_context()
         expect(context[APPLE]).toBe(appleValue)
         expect(context[PEACH]).toBe(peachValue)
         expect(context[THUMB]).toBe(thumbValue)
      }

      renderWithoutFruit()
      appleStack.push(appleValue)
      peachStack.push(peachValue)
      renderWithFruit();
      appleStack.pop()
      peachStack.pop()
      renderWithoutFruit()

      context[THUMB]= thumbValue
      $_run_with_(context, renderAsyncWithFruit)

      const outsideApple = getActiveApple()
      const outsidePeach = getActivePeach()
      const outsideThumb = getActiveThumb()
      expect(outsideApple).toBeFalsy()
      expect(outsidePeach).toBeFalsy()
      expect(outsideThumb).toBeFalsy()
   })

   test.skip('AsyncState synchronous nesting', () => {

      const APPLE = 'apple'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)

      const appleValueA = ':) root'
      const appleValueB = ':) parent'
      const appleValueC = ':) child'

      function renderWithAppleRoot() {
         const apple = getActiveApple()
         expect(apple).toBe(appleValueA)

         appleStack.push(appleValueB)
         renderWithAppleParent()
         appleStack.pop()

         const apple2 = getActiveApple()
         expect(apple2).toBe(appleValueA)

      }
      function renderWithAppleParent() {
         const apple = getActiveApple()
         expect(apple).toBe(appleValueB)

         appleStack.push(appleValueC)
         renderWithAppleChild()
         appleStack.pop()

         const apple2 = getActiveApple()
         expect(apple2).toBe(appleValueB)
      }

      function renderWithAppleChild() {
         const apple = getActiveApple()
         expect(apple).toBe(appleValueC)
      }

      function renderWithoutApple() {
         const apple = getActiveApple()
         expect(apple).toBeFalsy()
      }

      renderWithoutApple()
      appleStack.push(appleValueA)
      renderWithAppleRoot();
      appleStack.pop()
      renderWithoutApple()
   })

   test.skip('AsyncState synchronous nesting with context', () => {

      const APPLE = 'apple'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)

      const appleValueA = ':) root'
      const appleValueB = ':) parent'
      const appleValueC = ':) child'

      function renderWithAppleRoot() {
         const context = $_snap_context()
         const apple = context[APPLE]
         expect(apple).toBe(appleValueA)

         appleStack.push(appleValueB)
         renderWithAppleParent()
         appleStack.pop()

         const context2 = $_snap_context()
         const apple2 = context2[APPLE]
         expect(apple2).toBe(appleValueA)

      }
      function renderWithAppleParent() {
         const context = $_snap_context()
         const apple = context[APPLE]
         expect(apple).toBe(appleValueB)

         appleStack.push(appleValueC)
         renderWithAppleChild()
         appleStack.pop()

         const context2 = $_snap_context()
         const apple2 = context2[APPLE]
         expect(apple2).toBe(appleValueB)
      }

      function renderWithAppleChild() {
         const context = $_snap_context()
         const apple = context[APPLE]
         expect(apple).toBe(appleValueC)
      }

      function renderWithoutApple() {
         const context = $_snap_context()
         const apple = context[APPLE]
         expect(apple).toBeFalsy()
      }

      renderWithoutApple()
      appleStack.push(appleValueA)
      renderWithAppleRoot();
      appleStack.pop()
      renderWithoutApple()
   })


   test.skip('AsyncState nesting with context, $run_with, add to', () => {

      const APPLE = 'apple'
      const BUBBLE = 'bubble'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)
      const [getActiveBubble, bubbleStack] = AsyncState<string>(BUBBLE)

      const appleValueA = ':) root'
      const appleValueB = ':) parent'
      const appleValueC = ':) child'

      function renderWithAppleRoot() {
         const context = $_snap_context()
         const apple = context[APPLE]
         expect(apple).toBe(appleValueA)

         appleStack.push(appleValueB)
         renderWithAppleParent()
         appleStack.pop()

         const context2 = $_snap_context()
         const apple2 = context2[APPLE]
         expect(apple2).toBe(appleValueA)

      }
      function renderWithAppleParent() {
         const context = $_snap_context()
         const apple = context[APPLE]
         expect(apple).toBe(appleValueB)

         appleStack.push(appleValueC)
         renderWithAppleChild()
         appleStack.pop()

         const context2 = $_snap_context()
         const apple2 = context2[APPLE]
         expect(apple2).toBe(appleValueB)
      }

      let childContext: any;

      function renderWithAppleChild() {
         childContext = $_snap_context()
         const apple = childContext[APPLE]
         expect(apple).toBe(appleValueC)
      }

      function renderWithoutApple() {
         const context = $_snap_context()
         const apple = context[APPLE]
         expect(apple).toBeFalsy()
      }

      const bubbleValue = 'ooo'

      function renderAsync(){
         childContext = $_snap_context()
         const apple = childContext[APPLE]
         expect(apple).toBe(appleValueC)
         const bubble = childContext[BUBBLE]
         expect(bubble).toBe(bubbleValue)
      }

      renderWithoutApple()
      appleStack.push(appleValueA)
      renderWithAppleRoot();
      appleStack.pop()
      renderWithoutApple()

      childContext[BUBBLE]= bubbleValue
      $_run_with_(childContext, renderAsync)
   })

})