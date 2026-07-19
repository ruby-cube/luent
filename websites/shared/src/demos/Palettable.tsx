import { As, ContextKey, css, For, fromContext, FromTag, If, ion, ionic, NodeRef, Style, track } from "@rue/luent";
import { moveUniqueItems } from "@rue/utils";

export function Palettable() {
  const $count = ion(0)
  const $complete = ion(false)
  const $container = NodeRef('div')

  return <>
    <div ref={$container} class='palettable'>
      <o:context provide={HOST($container())}>
        {As($count,
          <ColorPalette
            class='anchor'
            before:mount={$complete.value = false}
            animate-in='slide-in'
            count={5}
            onComplete={() => $complete.value = true}
          ></ColorPalette>
        )}
      </o:context>
      {If($complete,
        <button class='next-btn' transition-in on:click={() => {
          $count.value++ % 2;
        }}>Next</button>
      )}
    </div>

    {Style(css`
      * {
        margin: 0;
        padding: 0;
      }

      .anchor {
        anchor-name: --color-palette;
      }

      .palettable {
        display: flex;
        flex-direction: column;
        justify-content: center;
        background-color: white;
        width: 100%;
        height: 100%;
      }

      .palettable .next-btn {
        width: 88px;
        height: 44px;
        border-radius: 22px;
        padding: 10px;
        border: none;
        margin-top: 132px;
        align-self: center;
        cursor: pointer;
        position: fixed;
        position-anchor: --color-palette;
      }

     @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(-100px);
        }

        to {
          opacity: 1;
          transform: translateY(0px);
        }
      }

      .palettable .slide-in {
        animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) slide-in forwards;
      }
    `)}
  </>
}
type Color = {
  h: number,
  s: number,
  l: number,
}

const HOST = ContextKey<HTMLElement | undefined>('host')

function ColorPalette(setup: FromTag<{
  count: number,
  onComplete: () => void
}>) {
  const { count, onComplete, ...rest } = setup
  const genColor = useRandomColorGenerator()

  const [h, s, l] = genColor()
  const goal = goalHue(h)
  const hues = getSteps(h, goal, count).map(hue => hue % 360)
  const sats = getSteps(s, (s + 30) % 100, count)
  const lights = getSteps(l, (l + 30) % 100, count)

  const sortedColors = composeColorArray(hues, sats, lights)
  const reverseColors = sortedColors.toReversed()

  const colors = ionic(shuffle([...sortedColors]), {
    insertSelected(index: number) {
      if (!selected.size) return;
      moveUniqueItems(selected, this, index)
      selected.clear()
    }
  })

  const $isComplete = ion(() => {
    let i = 0;
    let failed = 0;
    for (const color of colors) {
      if (color !== sortedColors[i]) {
        failed++;
        break;
      }
      i++;
    }
    i = 0;
    for (const color of colors) {
      if (color !== reverseColors[i]) {
        failed++;
        break;
      }
      i++;
    }
    return failed < 2;
  })

  track($isComplete, () => {
    if ($isComplete()) {
      setTimeout(celebrate, 250) // 250 to ensure item transitions are complete
    }
  })

  const $magnifiedIndex = ion(undefined as number | undefined);

  function celebrate() {
    $magnifiedIndex.value = 0;
    const id = setInterval(() => {
      $magnifiedIndex.value!++
      if ($magnifiedIndex() === 7) {
        onComplete()
        clearInterval(id)
        $magnifiedIndex.value = undefined
      }
    }, 100)
  }

  function magnified(index: number) {
    return index === $magnifiedIndex();
  }

  const selected = ionic(new Set())

  function toggleSelect(block: Color) {
    if (selected.has(block)) selected.delete(block)
    else selected.add(block)
  }

  function deselectAll() {
    selected.clear()
  }

  function isSelected(block: Color | undefined) {
    if (!block) return false;
    return selected.has(block)
  }
  console.log('host?', fromContext(HOST))

  return <>
    <o--portal to={fromContext(HOST) ?? window} on:click={e => e.target.closest('.clickable') || deselectAll()} />
    <div class='container' auto-bind={rest}>
      <div class='row'>
        <button
          class='clickable gap'
          disabled={() => selected.size === 0 || isSelected(colors[0])}
          on:click={() => colors.insertSelected(0)}
        ></button>
        {For(colors, m => m, (color, $index) =>
          <>
            <div
              transition-item
              on:click={() => toggleSelect(color)}
              class={['clickable', 'square', {
                'selected': () => isSelected(color),
                'magnifying': () => $magnifiedIndex() !== undefined
              }]}
              style={{
                'background-color': `hsl(${color.h}deg, ${color.s}%, ${color.l}%)`,
                'transform': () => magnified($index()) ? `scale(1.25)` : `scale(1)`
              }}
            ></div>
            <button
              class='clickable gap'
              disabled={() => selected.size === 0 || isSelected(color) || isSelected(colors[$index() + 1])}
              on:click={() => colors.insertSelected($index() + 1)}
            ></button>
          </>
        )}
      </div>
    </div>

    {Style(css`

      .palettable .container {
        display: flex;
        flex-direction: column;
      }

      .palettable .row {
        display: flex;
        margin-inline: auto;
      }

      .palettable .selected {
        outline: 5px solid hsla(35deg 10% 50% / 50%);
      }

      .palettable .square {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        cursor: pointer;
      }
      
      .palettable .magnifying {
        transition: transform 90ms ease-in;
      }

      .palettable .gap {
        margin: 0px;
        display: block;
        border: none;
        width: 24px;
        height: 44px;
        background-color: transparent;
        border-radius: 10px;
      }
      
      .palettable .gap:hover:enabled {
        background-color: #ccc;
      }
    `)}
  </>
}

function composeColorArray(hues: number[], sats: number[], lights: number[]) {
  const colors = []
  for (let i = 0; i < hues.length; i++) {
    const color = {
      h: hues[i],
      s: sats[i],
      l: sats[i]
    }
    colors.push(color)
  }
  return colors
}

function shuffle<T>(array: T[]): T[] {
  // Loop from the last element down to the second
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements using array destructuring
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getSteps(a: number, b: number, n: number): number[] {
  const step = Math.floor((a - b) / n)
  const steps = [a]
  let i = 1
  while (i <= n) {
    steps.push(a + (step * i))
    i++;
  }
  return steps
}

function useRandomColorGenerator() {
  let previous = ''
  return function genColor(): [number, number, number] {
    const h = Math.floor(Math.random() * 360);
    const s = 30 + Math.floor(Math.random() * 40);
    const l = 30 + Math.floor(Math.random() * 35);
    const color = `${h}+${s}+${l}`
    if (color === previous) return genColor();
    previous = `${h}+${s}+${l}`
    return [
      h,
      s,
      l
    ]
  }
}

function goalHue(baseHue: number) {
  const h = Math.floor(Math.random() * 360);
  const hueGap = Math.abs(baseHue - h)
  if (hueGap < 60 || hueGap > 120) return goalHue(baseHue)
  return h;
}

Palettable.nsx = `function Palettable() {
  get count = ion(0)
  get complete = ion(false)

  <:>
    <div class='app'>
      {As(count@,
        <ColorPalette
          before:mount={complete = false}
          animate-in='slide-in'
          count={5}
          onComplete={() => setTimeout(() => complete = true, 1000)}
        ></ColorPalette>
      )}
      <button show-if={complete@} transition-in on:click={() => count++}>
        Next
      </button>
    </div>

    <o-style>
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(-100px);
        }
        to {
          opacity: 1;
          transform: translateY(0px);
        }
      }

      .slide-in {
        animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) slide-in forwards;
      }
    </o-style>
  </:>
}`


Palettable.tsx = `function Palettable() {
  const $count = ion(0)
  const $complete = ion(false)

  return <>
    <div class='app'>
      {As($count,
        <ColorPalette
          before:mount={$complete.value = false}
          animate-in='slide-in'
          count={5}
          onComplete={() => setTimeout(() => $complete.value = true, 1000)}
        ></ColorPalette>
      )}
      <button show-if={$complete} transition-in on:click={() => $count.value++}>
        Next
      </button>
    </div>

    {Style(css\`
      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(-100px);
        }
        to {
          opacity: 1;
          transform: translateY(0px);
        }
      }

      .slide-in {
        animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) slide-in forwards;
      }
    \`)}
  </>
}`