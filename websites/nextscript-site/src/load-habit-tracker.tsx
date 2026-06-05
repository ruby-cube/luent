import { createRoot, css, queueTask, Style } from "@rue/luent"
import { Code } from './Code'
import { HabitTracker } from "./HabitTracker"
import { renderCodeToHtml } from "./code-utils"

// const styles =
//   `     .tracker {
//         position: relative;
//       }

//       .tracker ul {
//         display: inline-flex;
//         gap: 0.25rem;
//         margin: 0 0 0 0.5rem;
//         padding: 0;
//         list-style-type: none;
//         vertical-align: middle;
//       }

//       li {
//         width: .85rem;
//         height: .85rem;
//         display: inline-flex;
//         align-items: center;
//         justify-content: center;
//         line-height: 1;
//         background-color: transparent;
//         box-sizing: border-box;
//         text-align: center;
//       }

//       li.unit {
//         border: 1px solid currentColor;
//         border-radius: 50%;
//         transition: background-color 0.15s ease;
//       }

//       li.filled {
//         background-color: currentColor;
//       }

//       .star {
//         font-size: 0.95rem;
//         position: absolute;
//         right: 0;
//         top: 55%;
//         transform: translate(125%, -50%);
//         pointer-events: none;
//         margin: 0px;
//       }`

// const indentedStyles = indent(styles)

// function indent(code: string) {
//   return code
//     .split('\n')
//     .map(line => `  ${line}`)
//     .join('\n')
// }

// const STYLES = '$Styles'

const nsx =
  `import { ion, If, Thru } from "@rue/luent";

export function HabitTracker({ habit, goal = 5 }) {
  get count = ion(0)
  get achieved = ion((count === goal)@)

  <:component>
    <div class='tracker'>
      {habit}
      <ul>
        {Thru(goal, (n) <:>
          <li on:click={() => count = n}>
            <div class={['unit', { 'filled': (n <= count)@ }]}></div>
          </li>
        )}
      </ul>
      {If(achieved@,
        <span class='star'>🌟</span>
      )}
    </div>

    <o-link href='/src/demos/habit-tracker.css' rel='stylesheet' />
  </:component>
}`

const transpiled =
  `import { ion, If, Thru } from "@rue/luent";
import { JSXComponent } from "@rue/nextscript";

export function HabitTracker({ habit, goal = 5 }) {
  const count = assertGetter(ion(0))
  const achieved = assertGetter(ion(() => count() === goal))

  return JSXComponent({
    slot: <>
      <div class='tracker'>
        {habit}
        <ul>
          {Thru(goal, n => <>
            <li on:click={() => count.value = n}>
              <div class={['unit', { 'filled': () => n <= count() }]}></div>
            </li>
          </>)}
        </ul>
        {If(achieved, () => <>
          <span class='star'>🌟</span>
        </>)}
      </div>

      <o-link href='/src/demos/habit-tracker.css' rel='stylesheet' />
    </>
  })
}`

export function load() {
  createRoot(() => (
    <>
      <div class='demo-container'>
        <HabitTracker
          habit="water"
          goal={8}
          xray:li={x => <x.li style='margin: 0px'></x.li>}
        ></HabitTracker>
      </div>
      <Code
        trusted
        main={{ name: 'nsx', code: nsx }}
        alt={{ name: 'output', code: transpiled, lang: 'tsx' }}
        highlight={renderCodeToHtml}
      />
      {Style(css`
        .demo-container {
          position: relative;
          margin: 16px 0;
          padding: 28px;
          min-height: 180px;
          border: 1px solid var(--vp-c-divider);
          border-radius: 12px;
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .demo-container > * {
          position: relative;
          z-index: 1;
        }

        @media (max-width: 639px) {
          .demo-container {
            min-height: 150px;
            padding: 20px;
            border-radius: 10px;
          }
        }
      `)}
    </>
  )).mount('#habit-tracker-code')
}