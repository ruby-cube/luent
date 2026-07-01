import { ion, css, If, Style, Thru, FromTag } from "@rue/luent";

export function HabitTracker(setup: FromTag<{
  habit: string,
  goal?: number,
}>) {
  const { habit, goal = 5 } = setup

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
        {If(achieved,
          <span
            class='star'
          >🌟</span>
        )}
      </div>
      {Style(css`

        .tracker {
          position: relative;
        }

        .tracker ul {
          display: inline-flex;
          margin: 0 0 0 0.5rem;
          padding: 0;
          list-style-type: none;
          vertical-align: middle;
        }

        .tracker li {
          margin: 0px;
          padding: .125rem;
        }

        .tracker li:hover > div {
           outline: 2px solid #dddddd33;
        }
        
        div.unit {
          width: .85rem;
          height: .85rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          background-color: transparent;
          box-sizing: border-box;
          text-align: center;
          border: 1px solid currentColor;
          border-radius: 50%;
          transition: background-color 0.15s ease;
        }
        
        div.filled {
          background-color: currentColor;
        }
        
        .star {
          font-size: 0.95rem;
          position: absolute;
          right: 0;
          top: 55%;
          transform: translate(1.25rem, -0.9rem);
          pointer-events: none;
          margin: 0px;
        }
        `)}
    </>
  )
}