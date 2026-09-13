function normalizePath(path: string) {
  const [withoutHash] = path.split('#')
  const [withoutQuery] = withoutHash.split('?')
  if (!withoutQuery) return '/'
  if (withoutQuery !== '/' && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1)
  }
  return withoutQuery
}

export function smoothScrollHomepage(
  html: HTMLElement,
  page: string,
  previousPage?: string
) {
  const hasHash = page.includes('#')
  const from = previousPage ?? page
  const isSamePage = normalizePath(from) === normalizePath(page)
  html.style.scrollBehavior = hasHash && isSamePage ? 'smooth' : 'auto'
}