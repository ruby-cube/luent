import { test, expect } from "@playwright/test"
import "../playwright.fixtures"

const LOCAL_HOST = 'http://localhost:5173/'

test('TestIfElse', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestIfElse.tsx' })

   // assert initial render
   const initialView = await page.locator('.view').textContent()
   expect(initialView).toBe('ohhi')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeFalseView = await page.locator('.view').textContent()
   expect(activeFalseView).toBe('okbye')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeTrueView = await page.locator('.view').textContent()
   expect(activeTrueView).toBe('ohhi')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyTrueView = await page.locator('.view').textContent()
   expect(activeTrueReadyTrueView).toBe('ohhiready')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyFalseView = await page.locator('.view').textContent()
   expect(activeTrueReadyFalseView).toBe('ohhi')

   await page.locator('#toggle-active').click();
   await page.locator('#toggle-ready').click();
   const activeFalseReadyTrueView = await page.locator('.view').textContent()
   expect(activeFalseReadyTrueView).toBe('two peas in a pod🤢🤢')

   page.close()
})

test('TestIfElse-RemountCreate', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestIfElse-RemountCreate.tsx' })

   // assert initial render
   const initialView = await page.locator('.view').textContent()
   expect(initialView).toBe('ohhi')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeFalseView = await page.locator('.view').textContent()
   expect(activeFalseView).toBe('okbye')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeTrueView = await page.locator('.view').textContent()
   expect(activeTrueView).toBe('ohhi')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyTrueView = await page.locator('.view').textContent()
   expect(activeTrueReadyTrueView).toBe('ohhiready')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyFalseView = await page.locator('.view').textContent()
   expect(activeTrueReadyFalseView).toBe('ohhi')

   await page.locator('#toggle-active').click();
   await page.locator('#toggle-ready').click();
   const activeFalseReadyTrueView = await page.locator('.view').textContent()
   expect(activeFalseReadyTrueView).toBe('two peas in a pod🤢🤢')

   page.close()
})

test('TestIfElse-CreateRemount', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestIfElse-CreateRemount.tsx' })

   // assert initial render
   const initialView = await page.locator('.view').textContent()
   expect(initialView).toBe('ohhi')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeFalseView = await page.locator('.view').textContent()
   expect(activeFalseView).toBe('okbye')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeTrueView = await page.locator('.view').textContent()
   expect(activeTrueView).toBe('ohhi')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyTrueView = await page.locator('.view').textContent()
   expect(activeTrueReadyTrueView).toBe('ohhiready')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyFalseView = await page.locator('.view').textContent()
   expect(activeTrueReadyFalseView).toBe('ohhi')

   await page.locator('#toggle-active').click();
   await page.locator('#toggle-ready').click();
   const activeFalseReadyTrueView = await page.locator('.view').textContent()
   expect(activeFalseReadyTrueView).toBe('two peas in a pod🤢🤢')

   page.close()
})

test('TestIfElseRemountView', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestIfElseRemountView.tsx' })

   // assert initial render
   const initialView = await page.locator('.view').textContent()
   expect(initialView).toBe('ohhi')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeFalseView = await page.locator('.view').textContent()
   expect(activeFalseView).toBe('okbye')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeTrueView = await page.locator('.view').textContent()
   expect(activeTrueView).toBe('ohhi')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyTrueView = await page.locator('.view').textContent()
   expect(activeTrueReadyTrueView).toBe('ohhiready')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyFalseView = await page.locator('.view').textContent()
   expect(activeTrueReadyFalseView).toBe('ohhi')

   await page.locator('#toggle-active').click();
   await page.locator('#toggle-ready').click();
   const activeFalseReadyTrueView = await page.locator('.view').textContent()
   expect(activeFalseReadyTrueView).toBe('two peas in a pod🤢🤢')

   page.close()
})

test('TestIfElseDisplayView', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestIfElseDisplayView.tsx' })

   // assert initial render
   const initialView = await page.locator('.view').textContent()
   const initialActiveDisplay = await page.locator('#active').evaluate(div => div.style.display)
   const initialReadyDisplay = await page.locator('#ready').evaluate(div => div.style.display)
   const initialNeitherDisplay = await page.locator('#neither').evaluate(div => div.style.display)
   expect(initialView).toBe('ohhitwo peas in a pod🤢🤢okbye')
   expect(initialActiveDisplay).toBe('')
   expect(initialReadyDisplay).toBe('none')
   expect(initialNeitherDisplay).toBe('none')

   // toggle active
   await page.locator('#toggle-active').click();
   const view1 = await page.locator('.view').textContent()
   const activeDisplay1 = await page.locator('#active').evaluate(div => div.style.display)
   const readyDisplay1 = await page.locator('#ready').evaluate(div => div.style.display)
   const neitherDisplay1 = await page.locator('#neither').evaluate(div => div.style.display)
   expect(view1).toBe('ohhitwo peas in a pod🤢🤢okbye')
   expect(activeDisplay1).toBe('none')
   expect(readyDisplay1).toBe('none')
   expect(neitherDisplay1).toBe('')

   // toggle active
   await page.locator('#toggle-active').click();
   const view2 = await page.locator('.view').textContent()
   const activeDisplay2 = await page.locator('#active').evaluate(div => div.style.display)
   const readyDisplay2 = await page.locator('#ready').evaluate(div => div.style.display)
   const neitherDisplay2 = await page.locator('#neither').evaluate(div => div.style.display)
   expect(view2).toBe('ohhitwo peas in a pod🤢🤢okbye')
   expect(activeDisplay2).toBe('')
   expect(readyDisplay2).toBe('none')
   expect(neitherDisplay2).toBe('none')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const view3 = await page.locator('.view').textContent()
   const activeDisplay3 = await page.locator('#active').evaluate(div => div.style.display)
   const readyDisplay3 = await page.locator('#ready').evaluate(div => div.style.display)
   const neitherDisplay3 = await page.locator('#neither').evaluate(div => div.style.display)
   expect(view3).toBe('ohhireadytwo peas in a pod🤢🤢okbye')
   expect(activeDisplay3).toBe('')
   expect(readyDisplay3).toBe('none')
   expect(neitherDisplay3).toBe('none')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const view4 = await page.locator('.view').textContent()
   const activeDisplay4 = await page.locator('#active').evaluate(div => div.style.display)
   const readyDisplay4 = await page.locator('#ready').evaluate(div => div.style.display)
   const neitherDisplay4 = await page.locator('#neither').evaluate(div => div.style.display)
   expect(view4).toBe('ohhitwo peas in a pod🤢🤢okbye')
   expect(activeDisplay4).toBe('')
   expect(readyDisplay4).toBe('none')
   expect(neitherDisplay4).toBe('none')

   // toggle both
   await page.locator('#toggle-active').click();
   await page.locator('#toggle-ready').click();
   const view5 = await page.locator('.view').textContent()
   const activeDisplay5 = await page.locator('#active').evaluate(div => div.style.display)
   const readyDisplay5 = await page.locator('#ready').evaluate(div => div.style.display)
   const neitherDisplay5 = await page.locator('#neither').evaluate(div => div.style.display)
   expect(view5).toBe('ohhireadytwo peas in a pod🤢🤢okbye')
   expect(activeDisplay5).toBe('none')
   expect(readyDisplay5).toBe('')
   expect(neitherDisplay5).toBe('none')

   page.close()
})


test('TestConsecutiveIfElse', async ({ page }) => {
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestConsecutiveIfElse.tsx' })

   // assert initial render
   const initialView = await page.locator('.view').textContent()
   expect(initialView).toBe('ohhi')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeFalseView = await page.locator('.view').textContent()
   expect(activeFalseView).toBe('okbye')

   // toggle active
   await page.locator('#toggle-active').click();
   const activeTrueView = await page.locator('.view').textContent()
   expect(activeTrueView).toBe('ohhi')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyTrueView = await page.locator('.view').textContent()
   expect(activeTrueReadyTrueView).toBe('ohhitwo peas in a pod🤢🤢')

   // toggle ready
   await page.locator('#toggle-ready').click();
   const activeTrueReadyFalseView = await page.locator('.view').textContent()
   expect(activeTrueReadyFalseView).toBe('ohhi')

   await page.locator('#toggle-active').click();
   await page.locator('#toggle-ready').click();
   const activeFalseReadyTrueView = await page.locator('.view').textContent()
   expect(activeFalseReadyTrueView).toBe('okbyetwo peas in a pod🤢🤢')

   page.close()
})