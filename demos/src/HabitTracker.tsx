import { component, css, FromTag, If, Style, Thru } from "luent";
import { ion } from "@luent/quarky";

export function HabitTracker(setup: FromTag<{
  habit: string,
  goal?: number
}>) {
  const { habit, goal = 5 } = setup

  const count = ion(0)
  const achieved = ion(() => count() === goal)

  return (

    <div>
      {habit}
      <ul class='tracker'>
        {Thru(goal, n =>
          <li
            class={['unit', { 'filled': () => n <= count() }]}
            on:click={() => count.value = n}
          ></li>
        )}
        {If(achieved,
          <li class='star'>🌟</li>
        )}
      </ul>

      {Style(css`
        ul.tracker {
          display: inline-flex;
          gap: 0.25rem;
          margin: 0 0 0 0.5rem;
          padding: 0;
          list-style-type: none;
          vertical-align: middle;
        }

        li {
          width: .85rem;
          height: .85rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          background-color: transparent;
          box-sizing: border-box;
          text-align: center;
        }

        li.unit {
          border: 1px solid currentColor;
          border-radius: 50%;
          transition: background-color 0.15s ease;
        }

        li.filled {
          background-color: currentColor;
        }

        li.star {
          font-size: 0.95rem;
        }
      `)}
    </div>
  )
}