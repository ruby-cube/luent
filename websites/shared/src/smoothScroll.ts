// smooth scroll only on homepage

export function smoothScrollHomepage(html: HTMLElement, page: string) {
  if (page === '/' || page.startsWith('/#')) {
    html.style.scrollBehavior = 'smooth'
  }
  else {
    html.style.scrollBehavior = 'auto'
  }
}