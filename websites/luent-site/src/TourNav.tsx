import { css, For, FromTag, If, ion, Style } from "@rue/luent";


export function TourNav(setup: FromTag<{
  headings: { text: string, id: string }[]
}>) {
  const { headings } = setup
  const $hovered = ion('')
  const $selected = ion('')

  return <>
    <nav class='tour-nav'>
      <ul>
        {For(headings, heading => {
          const $hover = ion(() => $hovered() === heading.text)
          return <li
            on:pointerenter={() => $hovered.value = heading.text}
            on:pointerleave={() => $hovered.value = ''}
            class={{'hover': $hover}}
          >
            <a class={['circle', {
              'hover': $hover,
              'selected': () => $selected() === 'heading'
            }]}
              href={`/#${heading.id}`}
            ></a>
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

      .tour-nav li.hover {
        background-color: #33333344
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
        background-color: #444;
        box-sizing: border-box;
        text-align: center;
        border-radius: 50%;
        transition: background-color 0.15s ease;
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
        color: var(--vp-c-text-2)
      }

    `)}
  </>
}