import type { Router } from 'vitepress'

type BeforeRouteHook = NonNullable<Router['onBeforeRouteChange']>
type AfterRouteHook = NonNullable<Router['onAfterRouteChange']>

interface ScrollRestorationOptions {
  storageKey?: string
  onAfterRouteChange?: AfterRouteHook
}

const DEFAULT_STORAGE_KEY = 'vp-scroll-positions'

function normalizePath(path: string) {
  const [withoutHash] = path.split('#')
  const [withoutQuery] = withoutHash.split('?')
  if (!withoutQuery) return '/'
  if (withoutQuery !== '/' && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1)
  }
  return withoutQuery
}

function isBackForwardNavigation() {
  if (typeof performance === 'undefined') return false
  const entries = performance.getEntriesByType('navigation')
  const navEntry = entries[0] as PerformanceNavigationTiming | undefined
  return navEntry?.type === 'back_forward'
}

export function installVitePressScrollRestoration(
  router: Router,
  options: ScrollRestorationOptions = {}
) {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY
  const scrollPositions = new Map<string, number>()
  let shouldRestoreOnNextRouteChange = false

  function readPersistedScrollPositions() {
    if (typeof window === 'undefined') return {} as Record<string, number>
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (!raw) return {}
      const parsed = JSON.parse(raw) as Record<string, number>
      return parsed && typeof parsed === 'object' ? parsed : {}
    }
    catch {
      return {}
    }
  }

  function writePersistedScrollPosition(path: string, y: number) {
    if (typeof window === 'undefined') return
    try {
      const all = readPersistedScrollPositions()
      all[path] = y
      sessionStorage.setItem(storageKey, JSON.stringify(all))
    }
    catch {
      // Ignore storage failures (for example in privacy modes).
    }
  }

  function saveScrollPosition(path: string, y: number) {
    const normalized = normalizePath(path)
    scrollPositions.set(normalized, y)
    writePersistedScrollPosition(normalized, y)
  }

  function getSavedScrollPosition(path: string) {
    const normalized = normalizePath(path)
    const fromMemory = scrollPositions.get(normalized)
    if (typeof fromMemory === 'number') return fromMemory
    const fromStorage = readPersistedScrollPositions()[normalized]
    return typeof fromStorage === 'number' ? fromStorage : undefined
  }

  function restoreScroll(path: string) {
    const y = getSavedScrollPosition(path)
    if (typeof y !== 'number') return

    // Double RAF gives VitePress/layout hydration a frame before restoring.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const root = document.documentElement
        const previousBehavior = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto'
        window.scrollTo({ top: y, left: 0, behavior: 'auto' })
        root.style.scrollBehavior = previousBehavior
      })
    })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', () => {
      saveScrollPosition(window.location.pathname, window.scrollY)
    })

    // Mark SPA navigations initiated by browser back/forward.
    window.addEventListener('popstate', () => {
      shouldRestoreOnNextRouteChange = true
    })

    // Handles full-page back/forward when navigation bypasses VitePress router.
    if (isBackForwardNavigation()) {
      restoreScroll(window.location.pathname)
    }
  }

  const prevBeforeRouteChange = router.onBeforeRouteChange
  const prevAfterRouteChange = router.onAfterRouteChange

  router.onBeforeRouteChange = async (to) => {
    if (typeof window !== 'undefined') {
      saveScrollPosition(router.route.path, window.scrollY)
    }

    if (!prevBeforeRouteChange) return
    return prevBeforeRouteChange(to)
  }

  router.onAfterRouteChange = async (page) => {
    if (prevAfterRouteChange) {
      await prevAfterRouteChange(page)
    }

    if (options.onAfterRouteChange) {
      await options.onAfterRouteChange(page)
    }

    // Only restore when navigation came from browser back/forward.
    if (shouldRestoreOnNextRouteChange) {
      shouldRestoreOnNextRouteChange = false
      restoreScroll(page)
      return
    }

    // Let native anchor scrolling win for hash links on regular link navigations.
    if (page.includes('#')) return
  }
}