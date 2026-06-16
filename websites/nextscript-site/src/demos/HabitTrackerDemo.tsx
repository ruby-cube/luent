import { Code } from '../Code'
import { HabitTracker } from "./HabitTracker"
import { renderCodeToHtml } from "../code-utils"
import { DemoContainer } from "../DemoContainer"

export function HabitTrackerDemo() {
  return (
    <>
      <DemoContainer>
        <HabitTracker
          habit="water"
          goal={8}
          xray:li={x => <x.li style='margin: 0px'></x.li>}
        ></HabitTracker>
      </DemoContainer>
      <Code
        trusted
        main={{ name: 'nsx', code: nsx }}
        alt={{ name: 'output', code: transpiled, lang: 'tsx' }}
        highlight={renderCodeToHtml}
      />
    </>
  )
}

const nsx =
  `import { ion, If, Thru } from "@rue/luent";

export function HabitTracker({ habit, goal = 5 }) {
  get count = ion(0)
  get achieved = ion((count === goal)@)

  <::>
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
  </::>
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
