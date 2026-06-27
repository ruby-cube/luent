import { $of, component, css, Else, For, fromTag, If, RenderSlot, Style, TagClass } from "@rue/luent";
import { ion, Ion, Ionic, ionic } from "@rue/quarky";



export function EmojiQuest() {
  const powers = ['🍀', '🍄', '✨', '🔥', '🔮', '🪵'] as const
  const powerset = ionic(['🍀', '🍄', '✨'], {
    addRandomPower() {
      this.push(powers[Math.floor(Math.random() * powers.length)])
    }
  })

  return (
    <>
      <div class='emoji-quest'>
        <main>
          {/* <EmojiGame></EmojiGame> */}
        </main>
        <aside>
          <Panel title="Powerset">
            <Powerset mu:powerset={powerset} limit={10}></Powerset>
          </Panel>
        </aside>
      </div>
      {Style(css`
        .emoji-quest {
          align-self: start;
          font-family: 'Courier New';
          font-weight: 700;
        }
      `)}
    </>
  )
}

function Panel(setup: {
  title: string,
  Slot: RenderSlot
  width?: number
}) {
  const { title, Slot, width = 230 } = setup

  const opened = ion(true)

  return (
    <>
      <div class='panel'>
        <div class='top-bar'>{title}
          <button class='open-btn' on:click={() => opened.value = !opened.value}>
            {() => opened() ? '-' : '+'}
          </button>
        </div>
        <div display-if={opened} class='panel-body'>{Slot()}</div>
      </div>

      {Style(css`
        .panel {
          width: ${width}px;
          user-select: none;
        }

        .panel button.open-btn {
          width: 1.5rem;
          border: none;
          background-color: goldenrod;
          border-radius: 5px;
        }

        .panel .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: .5rem;
          background-color: gold;
          padding: .25rem .5rem;
          color: saddlebrown;
        }

        .panel-body {
          background-color: black;
          border: 2px solid goldenrod;
          overflow: hidden;
        }
      `)}
    </>
  )
}

function Powerset(setup: {
  'mu:powerset': Ionic<string[]> & { addRandomPower(): void }
  limit: number,
  class?: Ion<TagClass>
}) {
  const { mu, limit, $class } = fromTag(setup);
  const { powerset } = mu

  const count = $of(powerset).length
  const remaining = ion(() => limit - count())

  return <>
    <div class={['powerset-panel', $class]}>
      <ul class='powerset-list'>
        {For(powerset, power =>
          <li class='power-chip'>{power}</li>
        )}
      </ul>

      <div class='panel-footer'>
        <button
          class='add-power-button'
          disabled={() => count() === limit}
          on:click={() => mu.powerset.addRandomPower()}
        >
          +
        </button>

        <div class='stats'>
          <span class='stats-label'>Total</span>
          <span class='stats-value'>{count}/{limit}</span>
        </div>
      </div>

      {If(remaining,
        <>
          <div class='message'>You have {remaining} slots left.</div>
          <div class='message'>You started with {powerset.length} powers.</div>
        </>
      )}
      {Else(
        <>
          <div class='message'>Powerset complete.</div>
          <button class="reset-btn" on:click={() => powerset.length = 0}>Reset</button>
        </>
      )}
    </div>

    {Style(css`
        .powerset-panel {
           box-sizing: border-box;
           width: 100%;
           display: grid;
           gap: 0;
           padding: 1rem;
           background-color: #2d1b4e;
           box-shadow: 0 0 20px rgba(212, 175, 55, .25), inset 0 0 10px rgba(138, 43, 226, .1);
        }

        .powerset-panel > * + * {
           margin-top: .75rem;
        }

        .powerset-list {
           margin: .25rem;
           height: 9rem;
           padding: .5rem;
           list-style: none;
           display: flex;
           flex-wrap: wrap;
           align-content: flex-start;
           gap: .5rem;
           border-radius: .5rem;
           background-color: #0f0618;
           min-height: 2.75rem;
        }

        .power-chip {
           width: 2rem;
           height: 2rem;
           margin-top: unset !important;
           display: grid;
           place-items: center;
           border-radius: .4rem;
           border: 2px solid #d4af37;
           background: linear-gradient(135deg, #3d2817 0%, #2d1b4e 100%);
           font-size: 1.1rem;
           box-shadow: 0 0 8px rgba(212, 175, 55, .3);
        }

        .panel-footer {
           display: flex;
           align-items: center;
           justify-content: space-between;
           gap: .5rem;
        }

        .add-power-button {
           margin: .25rem;
           border: none;
           border-radius: .4rem;
           padding: .5rem .8rem;
           font-size: .85rem;
           font-weight: 700;
           text-transform: uppercase;
           letter-spacing: .05em;
           color: #d4af37;
           background-color: #8a2be244 !important;
           line-height: 1rem;
        }

        button {
          cursor: pointer;
        }

        .add-power-button:disabled {
           cursor: not-allowed;
           opacity: .4;
        }

        .add-power-button:hover:enabled {
          outline: 1px solid #8a2be2;
        }

        .stats {
           display: flex;
           align-items: baseline;
           gap: .4rem;
           color: #d4af37;
        }

        .stats-label {
           font-size: .75rem;
           text-transform: uppercase;
           letter-spacing: .05em;
           color: #8a2be2;
        }

        .stats-value {
           font-size: 1.1rem;
           font-weight: 700;
        }

        .message {
           border-radius: .45rem;
           padding: .55rem .65rem;
           font-size: .8rem;
           line-height: 1.4;
           margin: .25rem;
           background-color: #1a0e2e;
           color: #d4af37;
        }

        .reset-btn {
          padding: .55rem;
          margin: .25rem;
          font-family: inherit;
          font-weight: inherit;
          color: saddlebrown;
        }
      `)}
  </>
}