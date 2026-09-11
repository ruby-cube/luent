import type { FromTag, Ion } from "luent"
import { css, For, ion, Style } from "luent"

type Section = {
  heading: string;
  id: string
}


function padNum(num: number) {
  return String(num + 1).padStart(2, '0')
}

export function TourNav(setup: FromTag<{
  sections: Section[]
}>) {
  const { sections } = setup;

  const $activeIndex = ion(0)
  const $current = ion(() => padNum($activeIndex()))

  return <>
    <div class="rail-count"><b>{$current}</b>/12</div>
    <div class="rail-dots">
      {For(sections, (section, index) =>
        <TourDot
          isActive={() => $activeIndex() === index}
          onClick={() => $activeIndex.value = index}
          number={index + 1}
          heading={section.heading}
          id={section.id}
        />
      )}
    </div>

    {Style(css`
      .rail-count {
        font-family: "Fragment Mono", monospace;
        font-size: 11px;
        color: var(--ink-2);
      }

      .rail-count b {
        color: var(--teal-ink);
        font-weight: 400;
      }

      .rail-dots {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    `)}
  </>
}


function TourDot(setup: FromTag<{
  isActive: Ion<boolean>,
  onClick: () => void,
  number: number,
  heading: string,
  id: string
}>) {
  const { number, heading, id, $isActive, onClick } = setup
  const $active = ion(() => $isActive() ? 'active' : '')

  return <>
    <a href={`/#${id}`} on:click={onClick}>
      <button
        class={['rdot', $active]}
        aria-label={`Section ${number}: ${heading}`}
        title={`${padNum(number)} • ${heading}`}
      />
    </a>

    {Style(css`
      .rdot {
        position: relative;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--dotc);
        border: none;
        cursor: pointer;
        padding: 0;
        transition:
          background 0.2s,
          transform 0.2s;
      }

      .rdot:hover {
        background: var(--ink-2);
      }

      .rdot.active {
        background: var(--teal);
        transform: scale(1.4);
      }  
    `)}
  </>
}

