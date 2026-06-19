import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"
import "../playwright.fixtures"

const LOCAL_HOST = "http://localhost:5173/"

async function loadFixture(page: Page) {
  await page.goto(LOCAL_HOST, { waitUntil: "domcontentloaded" })

  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.addScriptTag({ type: "module", url: "/src/TestStylesBindings.tsx" })
      await page.locator("#simple-target").waitFor({ timeout: 5000 })
      return
    } catch (error) {
      lastError = error
      await page.waitForLoadState("domcontentloaded")
    }
  }

  throw lastError
}

test("styles/classes: simple reactive bindings", async ({ page }) => {
  await loadFixture(page)

  const initial = await page.locator("#simple-target").evaluate((el) => {
    const classList = Array.from(el.classList)
    return {
      classes: classList,
      color: getComputedStyle(el).color,
      weight: getComputedStyle(el).fontWeight,
    }
  })

  expect(initial.classes).toContain("simple-base")
  expect(initial.classes).toContain("simple-off")
  expect(initial.classes).toContain("simple-cold")
  expect(initial.classes).not.toContain("simple-on")
  expect(initial.classes).not.toContain("simple-hot")
  expect(initial.color).toBe("rgb(0, 0, 255)")
  expect(initial.weight).toBe("400")

  await page.locator("#toggle-simple").click()

  await expect.poll(async () => {
    return await page.locator("#simple-target").evaluate((el) => {
      const classList = Array.from(el.classList)
      return {
        classes: classList,
        color: getComputedStyle(el).color,
        weight: getComputedStyle(el).fontWeight,
      }
    })
  }).toMatchObject({
    classes: expect.arrayContaining(["simple-base", "simple-on", "simple-hot"]),
    color: "rgb(255, 0, 0)",
    weight: "700",
  })

  const toggledClasses = await page.locator("#simple-target").evaluate((el) => Array.from(el.classList))
  expect(toggledClasses).not.toContain("simple-off")
  expect(toggledClasses).not.toContain("simple-cold")
})

test("styles/classes: hierarchical auto-bind precedence", async ({ page }) => {
  await loadFixture(page)

  const initial = await page.locator("#hierarchy-target").evaluate((el) => {
    const classList = Array.from(el.classList)
    return {
      classes: classList,
      backgroundColor: getComputedStyle(el).backgroundColor,
    }
  })

  expect(initial.classes).toContain("class-leaf")
  expect(initial.classes).toContain("class-middle")
  expect(initial.classes).toContain("class-root")
  expect(initial.backgroundColor).toBe("rgb(20, 220, 20)")

  await page.locator("#toggle-hierarchy-root").click()

  await expect.poll(async () => {
    return await page.locator("#hierarchy-target").evaluate((el) => getComputedStyle(el).backgroundColor)
  }).toBe("rgb(220, 20, 20)")
})

test("microclass: merge conflicts with provideRoot twMerge", async ({ page }) => {
  await loadFixture(page)

  await expect.poll(async () => {
    const classes = await page.locator("#micro-target").evaluate((el) => Array.from(el.classList))
    return {
      classes,
      merged:
        classes.includes("px-8") &&
        classes.includes("py-6") &&
        classes.includes("text-green-500") &&
        !classes.includes("px-2") &&
        !classes.includes("px-4") &&
        !classes.includes("px-6") &&
        !classes.includes("py-2") &&
        !classes.includes("py-1") &&
        !classes.includes("text-blue-500"),
    }
  }).toMatchObject({ merged: true })

  const initial = await page.locator("#micro-target").evaluate((el) => Array.from(el.classList))

  expect(initial).toContain("px-8")
  expect(initial).toContain("py-6")
  expect(initial).toContain("text-green-500")
  expect(initial).not.toContain("px-2")
  expect(initial).not.toContain("px-4")
  expect(initial).not.toContain("px-6")
  expect(initial).not.toContain("py-2")
  expect(initial).not.toContain("py-1")
  expect(initial).not.toContain("text-blue-500")
})

test("microclass: reactive updates replace conflicting classes", async ({ page }) => {
  await loadFixture(page)

  await expect.poll(async () => {
    const classes = await page.locator("#micro-target").evaluate((el) => Array.from(el.classList))
    return {
      ok:
        classes.includes("px-8") &&
        classes.includes("py-6") &&
        classes.includes("text-green-500") &&
        !classes.includes("text-red-500"),
    }
  }).toMatchObject({ ok: true })

  await page.locator("#toggle-micro").click()

  await expect.poll(async () => {
    const classes = await page.locator("#micro-target").evaluate((el) => Array.from(el.classList))
    return {
      classes,
      merged:
        classes.includes("px-8") &&
        classes.includes("py-6") &&
        classes.includes("text-red-500") &&
        !classes.includes("text-green-500") &&
        !classes.includes("text-blue-500"),
    }
  }).toMatchObject({ merged: true })

  await page.locator("#toggle-micro").click()

  await expect.poll(async () => {
    const classes = await page.locator("#micro-target").evaluate((el) => Array.from(el.classList))
    return {
      merged:
        classes.includes("px-8") &&
        classes.includes("py-6") &&
        classes.includes("text-green-500") &&
        !classes.includes("text-red-500") &&
        !classes.includes("text-blue-500"),
    }
  }).toMatchObject({ merged: true })
})
