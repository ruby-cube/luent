import { Code, DemoContainer, HabitTracker } from '@luently/websites-shared'
import { highlightCode } from "../highlighter"

export function HabitTrackerDemo() {
  return <>
    <DemoContainer>
      <HabitTracker
        habit="water"
        goal={8}
      ></HabitTracker>
    </DemoContainer>
    <Code
      filename='HabitTracker'
      trusted
      alt={{ name: 'nsx', code: HabitTracker.nsx }}
      main={{ name: 'tsx', code: HabitTracker.tsx, lang: 'tsx' }}
      highlight={highlightCode}
      showSticky
    />
  </>
}

