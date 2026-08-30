import { css, Style, type FromTag } from "luent";

export function ThemeToggle(setup: FromTag<{ '...': 'button' }>) {

  return <>
    <button auto-bind={setup} class="toggle" type="button" role="switch" aria-checked="false" aria-label="Toggle color scheme">
      <span class="t-icon t-sun">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
      <span class="t-icon t-moon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </span>
      <span class="knob" aria-hidden="true"></span>
    </button>

    {Style(css`
       :root {
        --t-line: rgba(27, 42, 49, .35);
        --knob: #1B2A31;
        --t-sun: #FFFFFF;
        --t-moon: #51636B;
        --knob-x: 3px;
        --knob-y: 3px;
      }

      .dark {
        --t-line: rgba(234, 243, 245, .35);
        --knob: #9BE3EC;
        --t-sun: #9FB4BB;
        --t-moon: #08262C;
        --knob-x: 33px;
        --knob-y: 33px;
      }

      .toggle {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 60px;
        height: 30px;
        padding: 3px;
        border-radius: 999px;
        border: 1px solid var(--t-line);
        background: transparent
      }

      .t-icon {
        width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        position: relative;
        z-index: 2
      }

      .t-icon svg {
        width: 13px;
        height: 13px;
        display: block
      }

      .t-sun {
        color: var(--t-sun)
      }

      .t-moon {
        color: var(--t-moon)
      }

      .knob {
        position: absolute;
        top: 3px;
        left: var(--knob-x);
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background-color: var(--knob);
        transition: left 200ms ease, background-color 200ms ease;
      }
    `)}
  </>
}