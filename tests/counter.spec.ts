import { test, expect } from "@playwright/test"
import "../playwright.fixtures"

const LOCAL_HOST = 'http://localhost:5173/'



test('TestBoxMove', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestBoxMove.tsx' })
   const INITIAL_TRANSFORM = 'translate(0px, 0px)'
   const INCREMENT = await page.locator("[data-test]").getAttribute('data-test').then(res => res && JSON.parse(res).INCREMENT)
   // assert initial render
   const initialTransform = await page.locator('#box').evaluate(box => box.style.transform)

   expect(initialTransform).toBe(INITIAL_TRANSFORM)

   // move box to the right three times
   await page.getByRole('button', { name: '>' }).click();
   const transform1 = await page.locator('#box').evaluate(box => box.style.transform)
   expect(transform1).toBe(`translate(${INCREMENT}px, 0px)`)

   await page.getByRole('button', { name: '>' }).click();
   const transform2 = await page.locator('#box').evaluate(box => box.style.transform)
   expect(transform2).toBe(`translate(${INCREMENT * 2}px, 0px)`)

   await page.getByRole('button', { name: '>' }).click();
   const transform3 = await page.locator('#box').evaluate(box => box.style.transform)
   expect(transform3).toBe(`translate(${INCREMENT * 3}px, 0px)`)

   page.close()
})


test('TestCounter', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestCounter.tsx' })
   const staticText = 'x2 = '

   // assert initial render
   const [initialCount, initialDoubleCount] = await Promise.all([
      page.locator('#count').textContent(),
      page.locator('#double-count').textContent()
   ])
   expect(initialCount).toBe('0')
   expect(initialDoubleCount).toBe(staticText + '0')

   // increment count
   await page.getByRole('button', { name: '+' }).click();
   const [count1, doubleCount1] = await Promise.all([
      page.locator('#count').textContent(),
      page.locator('#double-count').textContent()
   ])
   expect(count1).toBe('1')
   expect(doubleCount1).toBe(staticText + '2')

   await page.getByRole('button', { name: '+' }).click();
   const [count2, doubleCount2] = await Promise.all([
      page.locator('#count').textContent(),
      page.locator('#double-count').textContent()
   ])
   expect(count2).toBe('2')
   expect(doubleCount2).toBe(staticText + '4')

   await page.getByRole('button', { name: '+' }).click();
   const [count3, doubleCount3] = await Promise.all([
      page.locator('#count').textContent(),
      page.locator('#double-count').textContent()
   ])
   expect(count3).toBe('3')
   expect(doubleCount3).toBe(staticText + '6')

   page.close()
})