import test, { expect } from "@playwright/test";

const LOCAL_HOST = 'http://localhost:5173/'

test.skip('TestAsyncSelect', async ({ page }) => {
   // test initial render
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestAsyncSelect.tsx' })

   const latency = JSON.parse((await page.locator('[data-test-latency]').getAttribute('data-test-latency'))!)
   const mainView = page.locator('.test-view')

   const initialView = await mainView.textContent()
   expect(initialView).toBe('loading...')

   // test loading view
   await page.waitForTimeout(latency[0])

   const loadingView = await mainView.textContent()
   expect(loadingView).toBe('loading...')

   // test loaded view
   await page.waitForTimeout(latency[1])

   const stateMenu = page.locator('.test-select-state')
   const cityMenu = page.locator('.test-select-city')
   const selectionP = page.locator('p')
   expect(selectionP).toHaveCSS('color', 'rgb(0, 0, 0)')

   const loadedState = await stateMenu.inputValue()
   expect(loadedState).toBe('California')

   const loadedCity = await cityMenu.inputValue()
   expect(loadedCity).toBe('Los Angeles')

   const loadedView = await mainView.textContent()
   expect(loadedView).toBe('CaliforniaNew YorkFloridaTexasUtahLos AngelesSan FranciscoSan DiegoSelection: Los Angeles, California')

   const selectionText = await selectionP.textContent()
   expect(selectionText).toBe('Selection: Los Angeles, California')

   // test pending selection
   await stateMenu.selectOption('Texas');

   const selectedState = await stateMenu.inputValue()
   expect(selectedState).toBe('Texas')
   expect(cityMenu).toBeDisabled()
   expect(selectionP).toHaveText('Selection: Los Angeles, California')
   expect(selectionP).toHaveCSS('color', 'rgb(128, 128, 128)')

   // test resolved selection
   await page.waitForTimeout(latency[1])

   const selectedCity = await cityMenu.inputValue()
   expect(selectedCity).toBe('Houston')

   expect(await selectionP.textContent()).toBe('Selection: Houston, Texas')
   expect(selectionP).toHaveCSS('color', 'rgb(0, 0, 0)')

   page.close()
})

test.skip('TestAsyncSelect: Race', async ({ page }) => {
   // test initial render
   await page.goto(LOCAL_HOST);
   await page.addScriptTag({ type: 'module', url: '/src/TestAsyncSelect.tsx' })

   const latency = JSON.parse((await page.locator('[data-test-latency]').getAttribute('data-test-latency'))!)
   const mainView = page.locator('.test-view')

   const initialView = await mainView.textContent()
   expect(initialView).toBe('loading...')

   // test loading view
   await page.waitForTimeout(latency[0])

   const loadingView = await mainView.textContent()
   expect(loadingView).toBe('loading...')

   // test loaded view
   await page.waitForTimeout(latency[1])

   const stateMenu = page.locator('.test-select-state')
   const cityMenu = page.locator('.test-select-city')
   const selectionP = page.locator('p')
   expect(selectionP).toHaveCSS('color', 'rgb(0, 0, 0)')

   const loadedState = await stateMenu.inputValue()
   expect(loadedState).toBe('California')

   const loadedCity = await cityMenu.inputValue()
   expect(loadedCity).toBe('Los Angeles')

   const loadedView = await mainView.textContent()
   expect(loadedView).toBe('CaliforniaNew YorkFloridaTexasUtahLos AngelesSan FranciscoSan DiegoSelection: Los Angeles, California')

   const selectionText = await selectionP.textContent()
   expect(selectionText).toBe('Selection: Los Angeles, California')

   // test pending selection
   await stateMenu.selectOption('Florida');

   const selectedState = await stateMenu.inputValue()
   expect(selectedState).toBe('Florida')
   expect(cityMenu).toBeDisabled()
   expect(selectionP).toHaveText('Selection: Los Angeles, California')
   expect(selectionP).toHaveCSS('color', 'rgb(128, 128, 128)')

   // test race selection
   await page.waitForTimeout(latency[1] / 2)

   await stateMenu.selectOption('Texas');
   expect(await stateMenu.inputValue()).toBe('Texas')
   expect(cityMenu).toBeDisabled()
   expect(selectionP).toHaveText('Selection: Los Angeles, California')
   expect(selectionP).toHaveCSS('color', 'rgb(128, 128, 128)')

   // test resolved race selection
   await page.waitForTimeout(latency[1])

   const selectedCity = await cityMenu.inputValue()
   expect(selectedCity).toBe('Houston')

   expect(await selectionP.textContent()).toBe('Selection: Houston, Texas')
   expect(selectionP).toHaveCSS('color', 'rgb(0, 0, 0)')

   page.close()
})