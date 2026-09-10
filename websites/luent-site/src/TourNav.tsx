import { atUnmount, css, For, FromTag, ion, Style } from "luent";

export function pad(value: number) {
  return String(value).padStart(2, '0')
}


export function TourNav(setup: FromTag<{
  headings: { text: string, id: string }[]
}>) {
  const { headings } = setup
  const $hovered = ion('')
  const $selected = ion(headings[0]?.id ?? '')

  function selectedIndex() {
    const index = headings.findIndex(heading => heading.id === $selected())
    return index < 0 ? 0 : index
  }

  if (typeof window !== 'undefined') {
    let raf = 0

    const updateActive = () => {
      const midpoint = window.innerHeight * 0.42
      let activeId = headings[0]?.id ?? ''

      for (const heading of headings) {
        const section = document.getElementById(heading.id)
        if (!section) continue
        if (section.getBoundingClientRect().top <= midpoint) {
          activeId = heading.id
        }
      }

      if (activeId) {
        $selected.value = activeId
      }
    }

    const queueActiveUpdate = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(updateActive)
    }

    window.addEventListener('scroll', queueActiveUpdate, { passive: true })
    window.addEventListener('resize', queueActiveUpdate, { passive: true })
    requestAnimationFrame(updateActive)

    atUnmount(() => {
      window.removeEventListener('scroll', queueActiveUpdate)
      window.removeEventListener('resize', queueActiveUpdate)
      if (raf) cancelAnimationFrame(raf)
    })
  }

  return <>
    <nav class='tour-nav' aria-label='Tour sections'>
      <div class='rail-count'><b>{() => pad(selectedIndex() + 1)}</b>/{pad(headings.length)}</div>
      {/* <div class='rail-count'><b>tour</b></div> */}
      <ul class='rail-dots'>
        {For(headings, heading => {
          const $hover = ion(() => $hovered() === heading.text)
          return <li
            on:pointerenter={() => $hovered.value = heading.text}
            on:pointerleave={() => $hovered.value = ''}
            class={{ hover: $hover }}
          >
            <a
              href={`/#${heading.id}`}
              on:click={() => { $selected.value = heading.id }}
            ><div class={['circle', {
              hover: $hover,
              selected: () => $selected() === heading.id
            }]}></div></a>
            <span display-if={$hover} class='heading'>{heading.text}</span>
          </li>
        })}
      </ul>
    </nav >
    {Style(css`
      .tour-nav {
        position: sticky;
        top: calc(15rem - 150px);
        display: flex;
        flex-direction: column;
        gap: 14px;
        align-items: center;
      }

      .tour-nav .rail-count {
        font-family: 'Fragment Mono', monospace;
        font-size: 11px;
        color: var(--vp-c-text-2);
      }

      .tour-nav .rail-count b {
        color: var(--vp-c-brand-1);
        font-weight: 500;
      }

      .tour-nav .rail-dots {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0;
        padding: 0;
      }

      .tour-nav li {
        position: relative;
        list-style-type: none;
      }

      .tour-nav .circle {
        width: 8px;
        height: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: #cfd1d4;
        box-sizing: border-box;
        border-radius: 50%;
        transition: background .2s, transform .2s;
      }

      .dark .tour-nav .circle {
        background-color: #33373e;
      }

      .tour-nav .circle:hover {
        background: var(--vp-c-text-2);
      }

      .tour-nav .circle.hover {
        transform: scale(1.25);
      }

      .tour-nav .circle.selected {
        background: var(--vp-c-brand-1);
        transform: scale(1.4);
      }

      .tour-nav .heading {
        position: absolute;
        right: calc(100% + 10px);
        top: 50%;
        transform: translateY(-50%);
        white-space: nowrap;
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid var(--vp-c-divider);
        font-family: 'Fragment Mono', monospace;
        font-size: 12px;
        color: var(--vp-c-white);
        background: color-mix(in srgb, var(--vp-c-black) 94%, transparent);
      }

      @media (max-width: 960px) {
        .tour-nav {
          display: none;
        }
      }

    `)}
  </>
}