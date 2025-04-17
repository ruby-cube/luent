import { describe, expect, it, test } from "vitest"
import { $_run_with_, $_snap_context, AsyncState } from "../context/AsyncContext"

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
         expect(apple).toBe(undefined)
      }

      renderWithoutApple()
      appleStack.push(appleValue)
      renderWithApple();
      appleStack.pop()
      renderWithoutApple()
   })

   test('$_snap_context', () => {

      const APPLE = 'apple'
      const PEACH = 'peach'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)
      const [getActivePeach, peachStack] = AsyncState<string>(PEACH)

      const appleValue = ':)'
      const peachValue = '<3'

      function renderWithFruit() {
         const context = $_snap_context()
         expect(context.get(APPLE)).toBe(appleValue)
         expect(context.get(PEACH)).toBe(peachValue)
      }

      function renderWithoutFruit() {
         const context = $_snap_context()
         expect(context.get(APPLE)).toBe(undefined)
         expect(context.get(PEACH)).toBe(undefined)
      }

      renderWithoutFruit()
      appleStack.push(appleValue)
      peachStack.push(peachValue)
      renderWithFruit();
      appleStack.pop()
      peachStack.pop()
      renderWithoutFruit()
   })


   test('$_run_with', () => {

      const APPLE = 'apple'
      const PEACH = 'peach'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)
      const [getActivePeach, peachStack] = AsyncState<string>(PEACH)

      const appleValue = ':)'
      const peachValue = '<3'
      let context: any;

      function renderWithFruit() {
         context = $_snap_context()
         expect(context.get(APPLE)).toBe(appleValue)
         expect(context.get(PEACH)).toBe(peachValue)
      }

      function renderWithoutFruit() {
         const context = $_snap_context()
         expect(context.get(APPLE)).toBe(undefined)
         expect(context.get(PEACH)).toBe(undefined)
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



   test('$_run_with and add to context', () => {

      const APPLE = 'apple'
      const PEACH = 'peach'
      const THUMB = 'thumb'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)
      const [getActivePeach, peachStack] = AsyncState<string>(PEACH)
      const [getActiveThumb, thumbStack] = AsyncState<string>(THUMB)

      const appleValue = ':)'
      const peachValue = '<3'
      const thumbValue = ';]'
      let context: any;

      function renderWithFruit() {
         context = $_snap_context()
         expect(context.get(APPLE)).toBe(appleValue)
         expect(context.get(PEACH)).toBe(peachValue)
      }

      function renderWithoutFruit() {
         const context = $_snap_context()
         expect(context.get(APPLE)).toBe(undefined)
         expect(context.get(PEACH)).toBe(undefined)
      }

      function renderAsyncWithFruit() {
         const apple = getActiveApple()
         const peach = getActivePeach()
         const thumb = getActiveThumb()
         expect(apple).toBe(appleValue)
         expect(peach).toBe(peachValue)
         expect(thumb).toBe(thumbValue)
         const context = $_snap_context()
         expect(context.get(APPLE)).toBe(appleValue)
         expect(context.get(PEACH)).toBe(peachValue)
         expect(context.get(THUMB)).toBe(thumbValue)
      }

      renderWithoutFruit()
      appleStack.push(appleValue)
      peachStack.push(peachValue)
      renderWithFruit();
      appleStack.pop()
      peachStack.pop()
      renderWithoutFruit()

      context.set(THUMB, thumbValue)
      $_run_with_(context, renderAsyncWithFruit)
      const outsideApple = getActiveApple()
      const outsidePeach = getActivePeach()
      const outsideThumb = getActiveThumb()
      expect(outsideApple).toBe(undefined)
      expect(outsidePeach).toBe(undefined)
      expect(outsideThumb).toBe(undefined)
   })

   test('AsyncState nesting', () => {

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
         expect(apple).toBe(undefined)
      }

      renderWithoutApple()
      appleStack.push(appleValueA)
      renderWithAppleRoot();
      appleStack.pop()
      renderWithoutApple()
   })

   test('AsyncState nesting with context', () => {

      const APPLE = 'apple'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)

      const appleValueA = ':) root'
      const appleValueB = ':) parent'
      const appleValueC = ':) child'

      function renderWithAppleRoot() {
         const context = $_snap_context()
         const apple = context.get(APPLE)
         expect(apple).toBe(appleValueA)

         appleStack.push(appleValueB)
         renderWithAppleParent()
         appleStack.pop()

         const context2 = $_snap_context()
         const apple2 = context2.get(APPLE)
         expect(apple2).toBe(appleValueA)

      }
      function renderWithAppleParent() {
         const context = $_snap_context()
         const apple = context.get(APPLE)
         expect(apple).toBe(appleValueB)

         appleStack.push(appleValueC)
         renderWithAppleChild()
         appleStack.pop()

         const context2 = $_snap_context()
         const apple2 = context2.get(APPLE)
         expect(apple2).toBe(appleValueB)
      }

      function renderWithAppleChild() {
         const context = $_snap_context()
         const apple = context.get(APPLE)
         expect(apple).toBe(appleValueC)
      }

      function renderWithoutApple() {
         const context = $_snap_context()
         const apple = context.get(APPLE)
         expect(apple).toBe(undefined)
      }

      renderWithoutApple()
      appleStack.push(appleValueA)
      renderWithAppleRoot();
      appleStack.pop()
      renderWithoutApple()
   })


   test('AsyncState nesting with context, $run_with, add to', () => {

      const APPLE = 'apple'
      const BUBBLE = 'bubble'

      const [getActiveApple, appleStack] = AsyncState<string>(APPLE)
      const [getActiveBubble, bubbleStack] = AsyncState<string>(BUBBLE)

      const appleValueA = ':) root'
      const appleValueB = ':) parent'
      const appleValueC = ':) child'

      function renderWithAppleRoot() {
         const context = $_snap_context()
         const apple = context.get(APPLE)
         expect(apple).toBe(appleValueA)

         appleStack.push(appleValueB)
         renderWithAppleParent()
         appleStack.pop()

         const context2 = $_snap_context()
         const apple2 = context2.get(APPLE)
         expect(apple2).toBe(appleValueA)

      }
      function renderWithAppleParent() {
         const context = $_snap_context()
         const apple = context.get(APPLE)
         expect(apple).toBe(appleValueB)

         appleStack.push(appleValueC)
         renderWithAppleChild()
         appleStack.pop()

         const context2 = $_snap_context()
         const apple2 = context2.get(APPLE)
         expect(apple2).toBe(appleValueB)
      }

      let childContext: any;

      function renderWithAppleChild() {
         childContext = $_snap_context()
         const apple = childContext.get(APPLE)
         expect(apple).toBe(appleValueC)
      }

      function renderWithoutApple() {
         const context = $_snap_context()
         const apple = context.get(APPLE)
         expect(apple).toBe(undefined)
      }

      const bubbleValue = 'ooo'

      function renderAsync(){
         childContext = $_snap_context()
         const apple = childContext.get(APPLE)
         expect(apple).toBe(appleValueC)
         const bubble = childContext.get(BUBBLE)
         expect(bubble).toBe(bubbleValue)
      }

      renderWithoutApple()
      appleStack.push(appleValueA)
      renderWithAppleRoot();
      appleStack.pop()
      renderWithoutApple()

      childContext.set(BUBBLE, bubbleValue)
      $_run_with_(childContext, renderAsync)
   })
})