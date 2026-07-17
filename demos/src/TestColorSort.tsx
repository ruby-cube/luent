import { As, css, For, FromTag, If, Ion, ion, ionic, Style, track } from "@rue/luent";
import { moveUniqueItems } from "@rue/utils";

export function TestColorSort() {
  const $count = ion(0)
  const $complete = ion(false)

  return <>
    <div class='color-sort-app'>
      {As($count,
        <ColorPalette animate-in='slide-in' animate-out='slide-out' onComplete={() => $complete.value = true}></ColorPalette>
      )}
      {If($complete,
        <button class='next-btn' on:click={() => {
          $count.value++ % 2;
          $complete.value = false
        }}>Next</button>
      )}
    </div>

    {Style(css`
      .color-sort-app {
        display: flex;
        flex-direction: column;
      }

      .next-btn {
        width: 88px;
        height: 44px;
        border-radius: 22px;
        padding: 10px;
        border: none;
        margin-top: 22px;
        align-self: center;
        cursor: pointer;
      }

     @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateX(-300px);
        }

        to {
          opacity: 1;
          transform: translateX(0px);
        }
      }

      @keyframes slide-out {
        from {
          opacity: 1;
          transform: translateX(0px);
        }

        to {
          opacity: 0;
          transform: translateX(300px);
        }
      }

      .slide-out {
        animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) slide-out;
      }

      .slide-in {
        animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) slide-in forwards;
      }

      .container {
        display: flex;
        flex-direction: column;
      }

      .row {
        display: flex;
        margin-inline: auto;
      }

      .selected {
        outline: 5px solid hsla(35deg 10% 50% / 50%);
      }

      .square {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        cursor: pointer;
      }
      
      .magnifying {
        transition: transform 90ms ease-in;
      }

      .gap {
        margin: 0px;
        display: block;
        border: none;
        width: 24px;
        height: 44px;
        background-color: transparent;
        border-radius: 10px;
      }
      
      .gap:hover:enabled {
        background-color: #ccc;
      }
    `)}
  </>
}
type Color = {
  h: number,
  s: number,
  l: number,
}

function ColorPalette(setup: FromTag<{
  onComplete: () => void
}>) {
  const { onComplete, ...rest } = setup
  const genColor = useRandomColorGenerator()

  const [h, s, l] = genColor()
  const goal = goalHue(h)
  const hues = getSteps(h, goal).map(hue => hue % 360)
  const sats = getSteps(s, (s + 30) % 100)
  const lights = getSteps(l, (l + 30) % 100)

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
      onComplete()
      setTimeout(celebrate, 250)
    }
  })

  const $magnifiedIndex = ion(undefined as number | undefined);

  function celebrate() {
    $magnifiedIndex.value = 0;
    const id = setInterval(() => {
      $magnifiedIndex.value!++
      if ($magnifiedIndex() === 7) {
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



  return <>
    <o--window on:click={e => e.target.closest('.clickable') || deselectAll()} />
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

function shuffle(array: any[]) {
  // Loop from the last element down to the second
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements using array destructuring
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getSteps(a: number, b: number): [number, number, number, number, number, number, number] {
  const step = Math.floor((a - b) / 6)
  return [a, a + step, a + step * 2, a + step * 3, a + step * 4, a + step * 5, a + step * 6]
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

