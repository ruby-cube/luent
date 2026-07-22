import { As, css, For, FromTag, If, ion, ionic, Style, Thru, track } from "@rue/luent";
import { Finitron, queueTask } from "@rue/quarky";
import { moveUniqueItems } from "@rue/utils";

export function TestColorSort() {
  const $count = ion(0, { increment() { $count.value++ } })

  return <>
    <div class='color-sort-app'>
      {As($count, () => {
        const $moves = ion(0, {
          increment() { $moves.value++ }
        })

        const palette = Finitron({
          'unsorted': { complete: () => 'x:sorted' },
          'x:sorted': {}
        })
        palette.init('unsorted')

        return <>
          <div class='moves-panel'>
            {$moves}
          </div>
          <ColorPalette
            class='anchor'
            animate-in='slide-in'
            onMove={$moves.increment}
            onComplete={() => setTimeout(() => palette.complete(), 1000)}
          ></ColorPalette>
          {If(() => palette.is('x:sorted'),
            <button
              transition-in
              class='next-btn'
              on:click={$count.increment}
            >Next</button>
          )}
        </>
      })}
    </div>

    {Style(css`
      * {
        margin: 0;
        padding: 0;
      }

      .anchor {
        anchor-name: --color-palette;
      }

      .color-sort-app {
        display: flex;
        flex-direction: column;
        height: 100vh;
        justify-content: center;
      }

      .next-btn {
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

      .slide-in {
        animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) slide-in forwards;
      }
    `)}
  </>
}

function ColorPalette(setup: FromTag<{
  size?: number;
  onMove: () => void;
  onComplete: () => void;
}>) {
  const { size = 5, onMove, onComplete, ...rest } = setup

  const { colors, $sorted } = ColorsKit(size)
  const selected = ionic(new Set<Color>())

  function toggleSelect(block: Color) {
    if (selected.has(block)) selected.delete(block)
    else selected.add(block)
  }

  function deselectAll() {
    selected.clear()
  }

  function isSelected(block: Color | undefined | null) {
    if (!block) return false;
    return selected.has(block)
  }

  function moveSelected(index: number) {
    if (!selected.size) return;
    colors.moveColors(selected, index)
    selected.clear()
    onMove()
  }

  track($sorted, () => {
    if ($sorted()) {
      onComplete()
      setTimeout(celebrate, 250) // 250 to ensure item transitions are complete
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
    }, 84)
  }

  function magnified(index: number) {
    return index === $magnifiedIndex();
  }



  let dragging = false;
  let dropIndex: number | null = null;
  let selectedIndex = 0;
  let dropZone: Element | null = null;

  /**
   * @state is transitioning tag-alongs
   */
  const $taggingAlong = ion(false)

  /**
   * @description prevents canceled drag and drops from being reselected by `toggleSelect`
   */
  function endDragging() {
    if (dragging) {
      dragging = false
      return true;
    }
  }

  const $shiftX = ion(0)
  const $shiftY = ion(0)

  function maybeDrag(e: PointerEvent, index: number, color: Color) {
    const target = e.currentTarget! as Element
    target.setPointerCapture(e.pointerId)
    let x = 0;
    let y = 0;

    const originalX = e.clientX
    const originalY = e.clientY

    target.addEventListener('pointermove', rePointermove)
    target.addEventListener('pointerup', rePointerUp)

    function rePointermove(e: any) {
      if (Math.abs(e.clientX - originalX) < 5 && Math.abs(e.clientY - originalY) < 5)
        return;
      dragging = true;
      selectedIndex = index;
      selected.add(color);
      startDrag()
      x = e.clientX
      y = e.clientY
      drag(e)
      target.removeEventListener('pointermove', rePointermove);
      target.addEventListener('pointermove', drag)
      if (selected.size > 1) {
        $taggingAlong.value = true;
        for (const color of selected) {
          // on transition end here
        }
      }
    }

    let prevDropZone = dropZone;

    function drag(e: any) {
      $shiftX.value = e.clientX - x;
      $shiftY.value = e.clientY - y;

      // Find the element underneath the pointer
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      dropZone = elementBelow?.closest('.drop-zone') ?? null;

      if (dropZone !== prevDropZone) {
        if (dropZone) {
          const i = Number(dropZone.getAttribute('data-drop-index'))
          dropZone = i === -1 ? dropZone.nextElementSibling! : i === colors.length + 1 ? dropZone.previousElementSibling! : dropZone
          const index = i === -1 ? 0 : i === colors.length + 1 ? colors.length : i;
          prevDropZone?.classList.remove('drop-target')
          dropZone.classList.add('drop-target');
          dropIndex = index
          prevDropZone = dropZone
        }
        else {
          prevDropZone?.classList.remove('drop-target')
          dropIndex = null;
          prevDropZone = null;
        }
      }
    }

    function rePointerUp(e: any) {
      if (dragging) {
        target.releasePointerCapture(e.pointerId)
        $shiftX.value = 0;
        $shiftY.value = 0;
        moveSelected(dropIndex === null ? selectedIndex : dropIndex);
        endDrag()
        selected.clear()
        target.removeEventListener('pointermove', drag)
      }
      target.removeEventListener('pointermove', rePointermove)
      target.removeEventListener('pointerup', rePointerUp)
    }
  }

  const $dragging = ion(false)

  function startDrag() {
    $dragging.value = true
  }

  function endDrag() {
    queueTask(() => dragging = false); // allows swatches to be selected after a drag and drop action
    $dragging.value = false;
  }

  /**
   * @description selected colors in order that matches original array
   */
  const $selected = ion(() => colors.filter(color => selected.has(color)))

  /**
   * @description nudges tag-alongs so that they are peeking out from the dragged swatch
   */
  function adjustX(x: number, index: number) {
    if (index === selectedIndex) return x;
    const delta = Math.abs(index - selectedIndex);
    const shift = delta * 24 + delta * 44
    const selected = $selected()
    const nudge = (selected.indexOf(colors[selectedIndex]) - selected.indexOf(colors[index])) * 8
    return index < selectedIndex ? x + shift - nudge : x - shift - nudge
  }

  /**
   * @description determines z-index
   */
  function order(index: number, selectedIndex: number) {
    if (index <= selectedIndex) return 150;
    const delta = selectedIndex - index
    return 150 + delta;
  }


  const $disableGap = ion(() => $dragging() || selected.size === 0)

  return <>
    <o--window on:click={e => e.from('.clickable') || deselectAll()} />
    <div class='container' auto-bind={rest}>
      <div class='row'>
        <Endgap
          disabled={$disableGap}
          on:click={() => moveSelected(0)}
        />
        <Gap
          disabled={$disableGap}
          on:click={() => moveSelected(0)}
        />
        {For(colors, m => m, (color, $index) => {
          const $dragged = ion(() => isSelected(color) && $dragging())
          const $tagalong = ion(() => $taggingAlong() && $dragged() && $index() !== selectedIndex)
          return <>
            <div
              transition-item
              on:pointerdown={e => maybeDrag(e, $index(), color)}
              on:transitionend={() => $taggingAlong.value = false}
              on:click={() => endDragging() || toggleSelect(color)}
              class={['clickable', { 'tag-along': $tagalong, 'dragged': $dragged }]}
              style={{
                'z-index': () => $dragged() ? order($index(), selectedIndex) : 0,
                'transform': () => $dragged() ? `translate(${adjustX($shiftX(), $index())}px, ${$shiftY()}px)` : 'unset'
              }}
            >
              <div
                class={['square', {
                  'selected': () => isSelected(color) && !$dragging(),
                  'selected-drag': $dragged,
                  'magnifying': () => $magnifiedIndex() !== undefined
                }]}
                style={{
                  'background-color': `hsl(${color.h}deg, ${color.s}%, ${color.l}%)`,
                  'transform': () => magnified($index()) ? `scale(1.25)` : `scale(1)`
                }}
              ></div>
            </div>
            <Gap
              disabled={$disableGap}
              on:click={() => moveSelected($index() + 1)}
            />
          </>
        })}
        <Endgap
          disabled={$disableGap}
          on:click={() => moveSelected(colors.length)}
        />
        {If($dragging,
          <div class='dropzones'>
            <div class='drop-zone' data-drop-index={-1}></div>
            {Thru(colors.length + 1, (count) =>
              <div
                class='drop-zone'
                data-drop-index={count - 1}
              >{Arrow()}</div>
            )}
            <div class='drop-zone' data-drop-index={colors.length + 1}></div>
          </div>
        )}
      </div>
    </div>

    {Style(css`
      .clickable {
        cursor: pointer;
      }

      .moves-panel {
        position: absolute;
        top: 0px;
        border: 2px solid gray;
        padding: 1rem;
        border-radius: 15px;
        width: 44px;
        margin: 10px;
        place-self: center;
        text-align: center;
        font-family: sans-serif;
      }

      .dragged {
        cursor: grabbing;
      }

      .tag-along {
        transition: transform 85ms ease;
      }

      .selected-stack {
        position: relative;
        width: 44px;
        height: 44px;
      }

      .selected-drag {
        box-shadow: -5px 0px 5px 0px rgba(0, 0, 0, 0.25);
      }

      .dropzones {
        position: absolute;
        display: flex;
        left: 0px;
      }

      .drop-zone {
        position: relative;
        width: 68px;
        height: 88px;
        z-index: 200;
        opacity: 0;
        transition: opacity 150ms ease-in-out;
      }

      .drop-target {
        opacity: 1;
      }

      .container {
        display: flex;
        flex-direction: column;
      }

      .row {
        position: relative;
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
      }
      
      .magnifying {
        transition: transform 90ms ease-in;
      }
    `)}
  </>
}

const Gap = (setup: FromTag) =>
  <>
    <button
      class='clickable gap'
      auto-bind={setup}
    >
      {Arrow()}
    </button>

    {Style(css`
      .gap {
        position: relative;
        margin: 0px;
        display: block;
        border: none;
        width: 24px;
        height: 44px;
        background-color: transparent;
        border-radius: 10px;
        opacity: 0;
        transition: opacity 150ms ease-in-out;
      }
      
      .gap:hover:enabled {
        opacity: 1;
      }

      .gap:enabled:has(+ .endgap:hover) {
        opacity: 1;
      }
    `)}
  </>


const Endgap = (setup: FromTag) =>
  <>
    <button
      class='clickable gap endgap'
      auto-bind={setup}
    ></button>

    {Style(css`
      .endgap:hover + .gap:enabled {
        opacity: 1;
      }

      .endgap {
        width: 90px;
      }
    `)}
  </>


const Arrow = () =>
  <>
    <div class='chevron-arrow'>
      <div class='chevron-down chevron-tic'></div>
      <div class='chevron-down chevron-tac'></div>
    </div>

    {Style(css`
      .chevron-arrow {
        position: absolute;
        left: 50%;
        top: -5px;
        width: 24px;
        height: 8px;
        transform: translateX(-50%);
      }

      .chevron-down {
        position: absolute;
        background-color: #ccc;
        top: 0;
        width: 20px;
        height: 8px;
        border-radius: 2px;
      }
      .chevron-tic {
        right: 40%;
        transform-origin: right center;
        transform: rotate(45deg);
      }
      .chevron-tac {
        left: 40%;
        transform-origin: left center;
        transform: rotate(-45deg);
      }
    `)}
  </>

export type Color = {
  h: number,
  s: number,
  l: number,
}

function ColorsKit(size: number = 5) {

  const genColor = useRandomColorGenerator()

  const [h, s, l] = genColor()
  const goal = goalHue(h)
  const hues = getSteps(h, goal, size).map(hue => hue % 360)
  const sats = getSteps(s, (s + 30) % 100, size)
  const lights = getSteps(l, (l + 30) % 100, size)

  const sortedColors = composeColorArray(hues, sats, lights)
  const reverseColors = sortedColors.toReversed()
  const colors = ionic(shuffle([...sortedColors]), {
    moveColors(items: Set<Color>, index: number) {
      moveUniqueItems(items, this, index)
    }
  })

  const $sorted = ion(() => {
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

  while ($sorted()) {
    shuffle(colors)
  }

  return {
    colors,
    $sorted
  }
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
    const l = 40 + Math.floor(Math.random() * 40);
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





