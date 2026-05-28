import { ion, component, css, FromTag, If, Style, Thru, Xray } from "@rue/luent";

export function HabitTracker(setup: FromTag<{
  habit: string,
  goal?: number,
  'xray:li'?: Xray<'li'>
}>) {
  const { xray, habit, goal = 5 } = setup
  console.log('xray??', xray)

  const count = ion(0)
  const achieved = ion(() => count() === goal)

  return component(
    <>
      <div class='tracker'>
        {habit}
        <ul>
          {Thru(goal, n =>
            <li
              class={['unit', { 'filled': () => n <= count() }]}
              on:click={() => count.value = n}
              auto-bind={xray.li}
            ></li>
          )}
        </ul>
        {If(achieved,
          <span
            class='star'
            auto-bind={xray.li}
          >🌟</span>
        )}
      </div>

      {Style(css`
        .tracker {
          position: relative;
        }

        .tracker ul {
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
        
        .star {
          font-size: 0.95rem;
          position: absolute;
          right: 0;
          top: 55%;
          transform: translate(125%, -50%);
          pointer-events: none;
          margin: 0px;
        }
        `)}
    </>
  )
}