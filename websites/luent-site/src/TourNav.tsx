import { atUnmount, css, For, FromTag, If, ion, Style } from "luent";


export function TourNav(setup: FromTag<{
  headings: { text: string, id: string }[]
}>) {
  const { headings } = setup
  const $hovered = ion('')
  const $selected = ion('')
  const $visible = ion(false)

  if (typeof window !== 'undefined') {
    let codeGlimpsesInView = false
    let dividerInView = false

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const element = entry.target as Element
        if (element.id === 'code-glimpses') {
          codeGlimpsesInView = entry.isIntersecting
        }

        if (element === featuresSection) {
          dividerInView = entry.isIntersecting
        }
      }

      if (!$visible()) {
        $visible.value = codeGlimpsesInView && !dividerInView
      }
      else if (dividerInView) {
        $visible.value = false;
      }
    }, { threshold: 0 })

    const tourHeading = document.querySelector('#code-glimpses')
    const featuresSection = document.querySelector('.VPFeatures')
    if (tourHeading) {
      observer.observe(tourHeading)
    }

    if (featuresSection) {
      observer.observe(featuresSection)
    }

    atUnmount(() => {
      observer.disconnect()
    })
  }

  return <>
    <nav class='tour-nav'>
      <ul display-if={$visible}>
        {For(headings, heading => {
          const $hover = ion(() => $hovered() === heading.text)
          return <li
            on:pointerenter={() => $hovered.value = heading.text}
            on:pointerleave={() => $hovered.value = ''}
            class={{ 'hover': $hover }}
          >
            <a
              href={`/#${heading.id}`}
            ><div class={['circle', {
              'hover': $hover,
              'selected': () => $selected() === 'heading'
            }]}></div></a>
            <span display-if={$hover} class='heading'>{heading.text}</span>
          </li>
        })}
      </ul>
    </nav >
    {Style(css`
      .tour-nav {
        position: fixed;
        left: 5px;
        top: 0px;
        bottom: 0px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .dark .tour-nav li.hover {
        background-color: #333333BF;
      }

      .tour-nav li.hover {
        background-color: #dddde3BF;
      }

      .tour-nav li {
        height: 2rem;
        padding: 4px 8px;
        list-style-type: none;
        display: flex;
        flex-direction: row;
        align-items: center;
        border-radius: 50px;
      }

      .tour-nav .circle {
        width: .5rem;
        height: .5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        background-color: #cccccc;
        box-sizing: border-box;
        text-align: center;
        border-radius: 50%;
        transition: background-color 0.15s ease;
      }
      
      .dark .circle {
        background-color: #444;
      }

      .tour-nav .circle.hover {
        width: .75rem;
        height: .75rem;
      }

      .tour-nav .circle.selected {
        border: 5px solid #444;
      }

      .tour-nav .heading {
        padding: 4px 8px;
        font-size: 14px;
        color: var(--vp-c-text-1);
      }

      @media (max-width: 960px) {
        .tour-nav {
          display: none;
        }
      }

    `)}
  </>
}