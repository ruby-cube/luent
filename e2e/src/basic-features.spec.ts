import { test, expect } from "@playwright/test"
import "../playwright.fixtures"

const LOCAL_HOST = 'http://localhost:5173/'

function parseTranslate(transform: string): { x: number; y: number } {
   const translateMatch = transform.match(/translate\(\s*(-?\d+(?:\.\d+)?)px(?:\s*,\s*(-?\d+(?:\.\d+)?)px)?\s*\)/)
   if (translateMatch) {
      return {
         x: Number(translateMatch[1]),
         y: Number(translateMatch[2] ?? 0),
      }
   }

   const matrixMatch = transform.match(/matrix\(\s*-?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*,\s*-?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/i)
   if (matrixMatch) {
      return {
         x: Number(matrixMatch[1]),
         y: Number(matrixMatch[2]),
      }
   }

   throw new Error(`Unsupported transform format: ${transform}`)
}



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


test('TestBoxMove', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestBoxMove.tsx' })
   const INCREMENT = await page.locator("[data-test]").getAttribute('data-test').then(res => res && JSON.parse(res).INCREMENT)
   // assert initial render
   const initialTransform = await page.locator('#box').evaluate(box => box.style.transform)
   const initialPosition = parseTranslate(initialTransform)

   expect(initialPosition).toEqual({ x: 0, y: 0 })

   // move box to the right three times
   await page.getByRole('button', { name: '>' }).click();
   const transform1 = await page.locator('#box').evaluate(box => box.style.transform)
   expect(parseTranslate(transform1)).toEqual({ x: INCREMENT, y: 0 })

   await page.getByRole('button', { name: '>' }).click();
   const transform2 = await page.locator('#box').evaluate(box => box.style.transform)
   expect(parseTranslate(transform2)).toEqual({ x: INCREMENT * 2, y: 0 })

   await page.getByRole('button', { name: '>' }).click();
   const transform3 = await page.locator('#box').evaluate(box => box.style.transform)
   expect(parseTranslate(transform3)).toEqual({ x: INCREMENT * 3, y: 0 })

   page.close()
})

test.skip('TestListSelection', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestListSelection.tsx' })

   await page.getByText('+').first().click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('+').nth(1).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('+').nth(3).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.locator('div:nth-child(9) > div > div').click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('X').nth(4).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('X').nth(1).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('4').first().click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('new item').nth(1).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.locator('div:nth-child(8) > div:nth-child(2)').click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('insert').nth(1).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.locator('#root').click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('X').nth(5).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('X').nth(4).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('X').nth(2).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('X').first().click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('X').first().click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('X').click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('+').click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('+').nth(1).click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('+').first().click();
   await expect(page).toHaveScreenshot({ fullPage: true })
   await page.getByText('+').first().click();
   await expect(page).toHaveScreenshot({ fullPage: true })

   page.close()
})

