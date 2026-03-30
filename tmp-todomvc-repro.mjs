import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

await page.addInitScript(() => {
  localStorage.setItem('vue-todomvc', JSON.stringify([
    { id: 1, title: 'one', completed: false },
    { id: 2, title: 'two', completed: true },
    { id: 3, title: 'three', completed: false },
  ]))
})

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })

async function snapshot(label) {
  const result = await page.evaluate(() => ({
    clearDisplay: getComputedStyle(document.querySelector('.clear-completed')).display,
    toggleAllChecked: document.querySelector('#toggle-all')?.checked,
    remainingText: document.querySelector('.todo-count')?.textContent?.replace(/\s+/g, ' ').trim(),
    toggles: [...document.querySelectorAll('.toggle')].map((el, index) => ({
      index,
      checked: el.checked,
      completedClass: el.closest('li')?.className,
    })),
    storage: JSON.parse(localStorage.getItem('vue-todomvc') ?? '[]'),
  }))

  console.log(label)
  console.log(JSON.stringify(result, null, 2))
}

await snapshot('initial')
await page.click('#toggle-all')
await snapshot('after toggle-all on')
await page.click('#toggle-all')
await snapshot('after toggle-all off')
await page.locator('.toggle').nth(1).click()
await snapshot('after click second toggle')

await page.reload({ waitUntil: 'networkidle' })
await page.click('#toggle-all')
await page.click('#toggle-all')
await page.locator('.toggle').nth(0).click()
await snapshot('after click first toggle')

await browser.close()