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
      main={{ name: 'nsx', code: HabitTracker.nsx }}
      alt={{ name: 'tsx', code: HabitTracker.tsx, lang: 'tsx' }}
      highlight={highlightCode}
      showSticky
    />
  </>
}

