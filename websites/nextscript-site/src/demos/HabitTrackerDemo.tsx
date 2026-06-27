import { Code, DemoContainer } from '@rue/websites-shared'
import { highlightCode } from "../highlighter"
import { HabitTracker } from './HabitTracker'

export function HabitTrackerDemo() {
  return (
    <>
      <DemoContainer>
        <HabitTracker
          habit="water"
          goal={8}
        ></HabitTracker>
      </DemoContainer>
      <Code
        trusted
        main={{ name: 'nsx', code: nsx }}
        alt={{ name: 'tsx equivalent', code: tsx, lang: 'tsx' }}
        highlight={highlightCode}
        showSticky
      />
    </>
  )
}

const nsx =
  `import { ion, If, Thru } from "@rue/luent";

export function HabitTracker({ habit, goal = 5 }) {
  get count = ion(0)
  get achieved = ion((count === goal)@)

  <:>
    <div class='tracker'>
      {habit}
      <ul>
        {Thru(goal, n =>
          <li on:click={() => count = n}>
            <div class={['unit', { 'filled': (n <= count)@ }]}></div>
          </li>
        )}
      </ul>
      {If(achieved@,
        <span class='star'>🌟</span>
      )}
    </div>

    <o-link href='/src/habit-tracker.css' rel='stylesheet' />
  </:>
}
  

`

const tsx =
  `import { ion, If, Thru } from "@rue/luent";

export function HabitTracker({ habit, goal = 5 }) {
  const count = ion(0)
  const achieved = ion(() => count() === goal)

  return (
    <>
      <div class='tracker'>
        {habit}
        <ul>
          {Thru(goal, n =>
            <li on:click={() => count.value = n}>
              <div class={['unit', { 'filled': () => n <= count() }]}></div>
            </li>
          )}
        </ul>
        {If(achieved, () => <>
          <span class='star'>🌟</span>
        </>)}
      </div>

      <o-link href='/src/habit-tracker.css' rel='stylesheet' />
    </>
  )
}`
