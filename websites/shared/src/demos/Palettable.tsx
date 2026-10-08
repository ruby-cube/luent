import { Ion, queueTask, As, asJSX, css, For, fromContext, FromTag, If, ion, ionic, Style, Thru, observe, awaitTick, Bindings } from "luent";
import { moveUniqueItems } from "@luent/utils";

export function Palettable() {
  const $round = ion(1, {
    increment() { $round.value++ }
  })

  return <>
    <div class='palettable'>
      {As($round, () => {
        const $moves = ion(0, {
          increment() { $moves.value++ }
        })
        const $solved = ion(false)

        return <>
          <div class='moves-panel'>
            {$moves}
          </div>
          <ColorPalette
            class='anchor'
            animate-in='slide-in'
            onMove={$moves.increment}
            onComplete={() => $solved.value = true}
          ></ColorPalette>
          {If($solved,
            <button
              transition-in
              class='next-btn'
              on:click={$round.increment}
            >Next</button>
          )}
        </>
      })}
    </div>

    {Style(css`
      // * {
      //   margin: 0;
      //   padding: 0;
      // }

      .anchor {
        anchor-name: --color-palette;
      }

      .palettable {
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        background-color: white;
        width: 100%;
        height: 100%;
        min-height: 300px;
      }

      .moves-panel {
        position: absolute;
        top: 10px;
        right: 10px;
        border: 2px solid #555;
        padding: 0.55rem 0.75rem;
        border-radius: 15px;
        min-width: 22px;
        text-align: center;
        font-family: sans-serif;
        font-weight: 600;
        color: #555;
      }

      .next-btn {
        width: 88px;
        height: 44px;
        border-radius: 22px;
        background-color: #555;
        color: white;
        padding: 10px;
        border: none;
        margin-top: 154px;
        align-self: center;
        cursor: pointer;
        position: absolute;
        position-anchor: --color-palette;
      }

     @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(-200px);
        }

        to {
          opacity: 1;
          transform: translateY(0px);
        }
      }

      .slide-in {
        animation: 500ms cubic-bezier(0, 1, .5, 1) slide-in forwards;
      }
    `)}
  </>
}

function getDefaultSize() {
  if (typeof window === 'undefined') {
    return 5
  }
  return window.innerWidth > 680 ? 6 : 5
}

function ColorPalette(setup: FromTag<{
  size?: number;
  onMove: () => void;
  onComplete: () => void;
}>) {
  const { size = getDefaultSize(), onMove, onComplete, ...rest } = setup

  const { colors, $sorted } = ColorsKit(size)

  const selected = ionic(new Set<Color>())

  function toggleSelect(block: Color) {
    if (selected.has(block))
      selected.delete(block)
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

  const { $dragging, makeDraggable, DropZones } = DraggableKit<Color>({
    n: colors.length,
    onDrag(color) { selected.add(color) },
    onDrop(index) { moveSelected(index) },
    $selected: ion(() => colors.filter(color => selected.has(color))),
    isSelected: color => selected.has(color)
  })

  const $gapDisabled = ion(() => $dragging() || selected.size === 0)

  const { makeMagnifyable } = CelebrationKit($sorted, onComplete)

  return <>
    <o--host on:click={e => e.from('.clickable') || deselectAll()} />
    <div class='container no-select' auto-bind={rest}>
      <div class='row'>
        <Endgap
          disabled={$gapDisabled}
          on:click={() => moveSelected(0)}
        />
        <Gap
          disabled={$gapDisabled}
          on:click={() => moveSelected(0)}
        />
        {For(colors, m => m, (color, $index) =>
          <>
            <div
              transition-item
              before:mount={node => {
                makeDraggable(node, color, $index);
                makeMagnifyable(node, $index);
              }}
              class={['clickable', 'square', {
                'selected': () => isSelected(color) && !$dragging()
              }]}
              style={`background-color: hsl(${color.h}deg, ${color.s}%, ${color.l}%)`}
              on:click={() => $dragging() || toggleSelect(color)}
            ></div>
            <Gap
              disabled={$gapDisabled}
              on:click={() => moveSelected($index() + 1)}
            />
          </>
        )}
        <Endgap
          disabled={$gapDisabled}
          on:click={() => moveSelected(colors.length)}
        />
        <DropZones />
      </div>
    </div>

    {Style(css`
      .palettable .container {
        display: flex;
        flex-direction: column;
        touch-action: none;
      }

      .no-select {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none
      }
      
      .palettable .row {
        position: relative;
        display: flex;
        margin-inline: auto;
      }

      .palettable .clickable {
        cursor: pointer;
      }

      .palettable .selected {
        outline: 5px solid hsla(35deg 10% 50% / 50%);
      }

      .palettable .square {
        width: 44px;
        height: 44px;
        border-radius: 10px;
      }

      @media (max-width: 479px) {
        .palettable .square {
          width: 30px;
          height: 30px;
        }
      }
    `)}
  </>
}

const Gap = (setup: Bindings<'button'>) =>
  <>
    <button
      class='clickable gap'
      auto-bind={setup}
    >
      <Arrow />
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
        transition: opacity 120ms ease;
      }

      @media (max-width: 479px) {
        .gap {
          max-width: 26px;
        }
      }
      
      .gap:hover:enabled {
        opacity: 1;
      }

      .gap:enabled:has(+ .endgap:hover) {
        opacity: 1;
      }
    `)}
  </>


const Endgap = (setup: Bindings<'button'>) =>
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

      @media (max-width: 479px) {
        .endgap {
          max-width: 60px;
        }
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

      @media (max-width: 479px) {
        .chevron-arrow {
          max-width: 16px;
        }
        .chevron-down {
          width: 18px;
        }
        .chevron-tic {
          right: 35%;
        }
        .chevron-tac {
          left: 35%;
        }
      }


    `)}
  </>

function deepElementFromPoint(x: number, y: number, root: Document | ShadowRoot = document) {
  let element = root.elementFromPoint(x, y);

  while (element?.shadowRoot) {
    const nestedElement = element.shadowRoot.elementFromPoint(x, y);
    if (!nestedElement || nestedElement === element) break;
    element = nestedElement;
  }

  return element;
}

function DraggableKit<T>(config: {
  n: number,
  onDrag: (item: T) => void,
  onDrop: (dropIndex: number) => void,
  isSelected: (item: T) => boolean,
  $selected: Ion<T[]>,
  axis?: 'horizontal' | 'vertical' // TODO:
}) {
  const { n, onDrag, onDrop, isSelected, $selected, axis = 'horizontal' } = config

  let selectedItem: T | null = null;
  let selectedIndex: number | null = null;
  let dropIndex: number | null = null;
  let dropZone: Element | null = null;

   const phoneScreen = detectPhoneScreen()

  const $dragging = ion(false)
  const $stacked = ion(false) // whether tag-alongs should be offset from the lead swatch
  const $shiftX = ion(0)
  const $shiftY = ion(0)

  function maybeDrag(e: PointerEvent, item: T, index: number) {
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

      selectedItem = item;
      selectedIndex = index;
      $dragging.value = true
      onDrag(item);

      if ($selected().length > 1) {
        $stacked.value = true
      }

      x = e.clientX
      y = e.clientY
      drag(e)
      target.removeEventListener('pointermove', rePointermove);
      target.addEventListener('pointermove', drag)
    }

    let prevDropZone = dropZone;

    function drag(e: any) {
      $shiftX.value = e.clientX - x;
      $shiftY.value = e.clientY - y;

      // Find the element underneath the pointer
      const elementBelow = deepElementFromPoint(e.clientX, e.clientY);
      dropZone = elementBelow?.closest('.drop-zone') ?? null;

      if (dropZone !== prevDropZone) {
        if (dropZone) {
          const i = Number(dropZone.getAttribute('data-drop-index'))
          dropZone = i === -1 ? dropZone.nextElementSibling! : i === n + 1 ? dropZone.previousElementSibling! : dropZone
          const index = i === -1 ? 0 : i === n + 1 ? n : i;
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
      if ($dragging()) {
        target.releasePointerCapture(e.pointerId)
        $shiftX.value = 0;
        $shiftY.value = 0;
        $stacked.value = false
        onDrop(dropIndex === null ? selectedIndex! : dropIndex)
        // delaying prevents a swatch that is dropped in its original position from being reselected.
        queueTask(() => { $dragging.value = false });
        target.removeEventListener('pointermove', drag)
      }
      target.removeEventListener('pointermove', rePointermove)
      target.removeEventListener('pointerup', rePointerUp)
    }
  }
 

  // Tag-along
  /**
   * @description positions tag-alongs so that they are peeking out from the primary dragged swatch
   */
  function adjustX(x: number, item: T, index: number) {
    if (index === selectedIndex || selectedIndex === null) return x;
    const delta = Math.abs(index - selectedIndex);
    const shift = delta * 24 + delta * (phoneScreen ? 30 : 44)
    const selected = $selected()
    const nudge = (selected.indexOf(selectedItem!) - selected.indexOf(item)) * 8
    return index < selectedIndex ? x + shift - nudge : x - shift - nudge
  }

  /**
   * @description determines z-index
   */
  function order(index: number) {
    if (selectedIndex === null || index <= selectedIndex) return 150;
    const delta = selectedIndex - index
    return 150 + delta;
  }

  function makeDraggable(node: HTMLElement, item: T, $index: Ion<number>) {
    const $dragged = ion(() => isSelected(item) && $dragging());
    const $tagalong = ion(() => $dragged() && $index() !== selectedIndex);
    const $stackOffset = ion(() => $stacked() && $tagalong() ? adjustX(0, item, $index()) : 0)
    const $dragTransform = ion(() => axis === 'horizontal'
      ? `translate3d(${$shiftX()}px, ${$shiftY()}px, 0px)`
      : `translate3d(${$shiftY()}px, ${$shiftX()}px, 0px)`
    )
    const $translate = ion(() => {
      const offset = $stackOffset()
      return axis === 'horizontal' ? `${offset}px 0px` : `0px ${offset}px`
    })
    const $node = asJSX(node);

    <$node
      on:pointerdown={e => maybeDrag(e, item, $index())}
      class={{
        'tag-along': $tagalong,
        'dragged': $dragged,
      }}
      style={{
        'z-index': () => $dragged() ? order($index()) : 0,
        'transform': () => $dragged() ? $dragTransform() : undefined,
        'translate': () => $dragged() ? $translate() : undefined,
      }}
    />
  }

  Style(css`
    .dragged {
      cursor: grabbing !important;
      box-shadow: -5px 0px 5px 0px rgba(0, 0, 0, 0.25);
    }
  
    .tag-along {
      transition: translate 125ms ease-out;
    }
  `)


  function DropZones() {

    return <>
      {If($dragging,
        <div class='dropzones'>
          <div class='drop-zone' data-drop-index={-1}></div>
          {Thru(n + 1, count =>
            <div
              class='drop-zone'
              data-drop-index={count - 1}
            ><Arrow /></div>
          )}
          <div class='drop-zone' data-drop-index={n + 1}></div>
        </div>
      )}

      {Style(css`
        .dropzones {
          position: absolute;
          display: flex;
          left: -68px;
        }

        .drop-zone {
          position: relative;
          width: 68px;
          height: 88px;
          z-index: 200;
          opacity: 0;
        }

        @media (max-width: 479px) {
          .dropzones {
            left: -45px;
          }

          .drop-zone {
            width: 54px;
          }
        }

        .drop-target {
          opacity: 1;
        }
      `)}
    </>
  }

  return {
    makeDraggable,
    $dragging,
    DropZones
  }
}

function detectPhoneScreen() {
  return typeof window !== 'undefined' ? window.matchMedia("(max-width: 479px)").matches : false;
}


export type Color = {
  h: number,
  s: number,
  l: number,
}

const genColor = useRandomColorGenerator()

function ColorsKit(size: number) {
  const n = size - 1
  const [h, s, l] = genColor()
  const goal = goalHue(h)
  const hues = getSteps(h, goal, n).map(hue => hue % 360)
  const sats = getSteps(s, (s + 30) % 100, n)
  const lights = getSteps(l, (l + 30) % 100, n)

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
      l: lights[i]
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
    const l = 30 + Math.floor(Math.random() * 40);
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





function CelebrationKit($sorted: Ion<boolean>, onComplete: () => void) {

  observe($sorted, () => {
    if ($sorted()) {
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
        onComplete()
      }
    }, 84)
  }

  function magnified(index: number) {
    return index === $magnifiedIndex();
  }

  return {
    makeMagnifyable(node: HTMLElement, $index: Ion<number>) {
      const $node = asJSX(node);

      <$node
        class={{ 'magnifying': () => $magnifiedIndex() !== undefined }}
        style={{
          'transform': () => magnified($index()) ? `scale(1.25)` : `scale(1)`
        }}
      ></$node>

      Style(css`
        .magnifying {
          transition: transform 90ms ease-in;
        }
      `)
    }
  }
}



Palettable.nsx = `function Palettable() {
  get round = ion(1, {
    increment() { round++ }
  })

  <:>
    <div class='palettable'>
      {As(round@, :>
        <--->
        get solved = ion(false)
        get moves = ion(0, {
          increment() { moves++ }
        })
        <--->
        <div class='moves-panel'>
          {moves@}
        </div>
        <ColorPalette
          animate-in='slide-in'
          onMove={moves@.increment}
          onComplete={(){ $solved.value = true }}
        ></ColorPalette>
        {If(done@,
          <button transition-in on:click={round@.increment}>
            Next
          </button>
        )}
      )}
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
}

`


Palettable.tsx = `function Palettable() {
  const $round = ion(1, {
    increment() { $round.value++ }
  })

  return <>
    <div class='palettable'>
      {As($round, () => {
        const $solved = ion(false)
        const $moves = ion(0, {
          increment() { $moves.value++ }
        })

        return <>
          <div class='moves-panel'>
            {$moves}
          </div>
          <ColorPalette
            animate-in='slide-in'
            onMove={$moves.increment}
            onComplete={() => $solved.value = true}
          ></ColorPalette>
          {If($solved,
            <button transition-in on:click={$round.increment}>
              Next
            </button>
          )}
        </>
      })}
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


Palettable.nsxColorPalette = `function ColorPalette(setup: FromTag<'div', {
  size?: number;
  onMove: () => void;
  onComplete: () => void;
}>) {
  const { size = 6, onMove, onComplete, ...rest } = setup

  const { colors, sorted@ } = ColorsKit(size)

  const selected = ionic(new Set<Color>())

  function toggleSelect(block: Color) {
    if (selected.has(block))
      selected.delete(block)
    else selected.add(block)
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

  const { dragging@, makeDraggable, DropZones } = DraggableKit<Color>({
    n: colors.length,
    onDrag(color) { selected.add(color) },
    onDrop(index) { moveSelected(index) },
    selected: ion(() => colors.filter(color => selected.has(color))),
    isSelected: color => selected.has(color)
  })

  get gapDisabled = ion(() => dragging || selected.size === 0)

  const { makeMagnifyable } = CelebrationKit(sorted@, onComplete)

  <:>
    <o--host on:click={(e){ e.from('.clickable') || selected.clear() }} />
    <div class='container' auto-bind={rest}>
      <div class='row'>
        <Gap
          disabled={gapDisabled@}
          on:click={(){ moveSelected(0) }}
        />
        {For(colors, m => m, (color, index@) :>
          <div
            transition-item
            before:mount={(){
              makeDraggable(this, color, index@);
              makeMagnifyable(this, index@);
            }}
            class={['clickable', 'square', {
              'selected': (isSelected(color) && !dragging)@
            }]}
            style=\`background-color: hsl(\${color.h}deg, \${color.s}%, \${color.l}%)\`
            on:click={(){ dragging || toggleSelect(color) }}
          ></div>
          <Gap
            disabled={gapDisabled@}
            on:click={(){ moveSelected(index + 1) }}
          />
        )}
        <DropZones/>
      </div>
    </div>

    <o-style>
      .clickable {
        cursor: pointer;
      }

      .selected {
        outline: 5px solid hsla(35deg 10% 50% / 50%);
      }

      .square {
        width: 44px;
        height: 44px;
        border-radius: 10px;
      }
    </o-style>
  </:>
}
  

`



Palettable.tsxColorPalette = `function ColorPalette(setup: FromTag<'div', {
  size?: number;
  onMove: () => void;
  onComplete: () => void;
}>) {
  const { size = 6, onMove, onComplete, ...rest } = setup

  const { colors, $sorted } = ColorsKit(size)

  const selected = ionic(new Set<Color>())

  function toggleSelect(block: Color) {
    if (selected.has(block))
      selected.delete(block)
    else selected.add(block)
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

  const { $dragging, makeDraggable, DropZones } = DraggableKit<Color>({
    n: colors.length,
    onDrag(color) { selected.add(color) },
    onDrop(index) { moveSelected(index) },
    $selected: ion(() => colors.filter(color => selected.has(color))),
    isSelected: color => selected.has(color)
  })

  const $gapDisabled = ion(() => $dragging() || selected.size === 0)

  const { makeMagnifyable } = CelebrationKit($sorted, onComplete)

  return <>
    <o--host on:click={e => e.from('.clickable') || selected.clear()} />
    <div class='container' auto-bind={rest}>
      <div class='row'>
        <Gap
          disabled={$gapDisabled}
          on:click={() => moveSelected(0)}
        />
        {For(colors, m => m, (color, $index) =>
          <>
            <div
              transition-item
              before:mount={node => {
                makeDraggable(node, color, $index);
                makeMagnifyable(node, $index);
              }}
              class={['clickable', 'square', {
                'selected': () => isSelected(color) && !$dragging()
              }]}
              style={css\`background-color: hsl(\${color.h}deg, \${color.s}%, \${color.l}%)\`}
              on:click={() => $dragging() || toggleSelect(color)}
            ></div>
            <Gap
              disabled={$gapDisabled}
              on:click={() => moveSelected($index() + 1)}
            />
          </>
        )}
        <DropZones/>
      </div>
    </div>

    {Style(css\`
      .clickable {
        cursor: pointer;
      }

      .selected {
        outline: 5px solid hsla(35deg 10% 50% / 50%);
      }

      .square {
        width: 44px;
        height: 44px;
        border-radius: 10px;
      }
    \`)}
  </>
}`

Palettable.nsxGap = `function Gap(setup: FromTag<'button'>) {
  <:>
    <button
      class='clickable gap'
      auto-bind={setup}
    >
      <Arrow/>
    </button>

    <o-style>
      .gap {
        opacity: 0;
        transition: opacity 150ms ease-in-out;
      }
      
      .gap:hover:enabled {
        opacity: 1;
      }

      .gap:enabled:has(+ .endgap:hover) {
        opacity: 1;
      }
    </o-style>
  </:>
}


function Arrow() {
  <:>
    <div class='chevron-arrow'>
      <div class='chevron-down chevron-tic'></div>
      <div class='chevron-down chevron-tac'></div>
    </div>

    <o-link href='/assets/chevron.css' rel='stylesheet'/>
  </:>
}`

Palettable.tsxGap = `function Gap(setup: FromTag<'button'>) {
  return <>
    <button
      class='clickable gap'
      auto-bind={setup}
    >
      <Arrow/>
    </button>

    {Style(css\`
      .gap {
        opacity: 0;
        transition: opacity 150ms ease-in-out;
      }
      
      .gap:hover:enabled {
        opacity: 1;
      }

      .gap:enabled:has(+ .endgap:hover) {
        opacity: 1;
      }
    \`)}
  </>
}


const Arrow = () =>
  <>
    <div class='chevron-arrow'>
      <div class='chevron-down chevron-tic'></div>
      <div class='chevron-down chevron-tac'></div>
    </div>

    <o-link href='/assets/chevron.css' rel='stylesheet'/>
  </>

`


Palettable.nsxDraggableKit = `function DraggableKit<T>(config: {
  n: number,
  onDrag: (item: T) => void,
  onDrop: (dropIndex: number) => void,
  isSelected: (item: T) => boolean,
  selected: Ion<T[]>
}) {
  const { n, onDrag, onDrop, isSelected, selected@ } = config

  let selectedItem: T | null = null;
  let selectedIndex: number | null = null;
  let dropIndex: number | null = null;
  let dropZone: Element | null = null;

  get dragging = ion(false)
  get taggingAlong = ion(false) // tag-along transition
  get shiftX = ion(0)
  get shiftY = ion(0)

  function maybeDrag(e: PointerEvent, item: T, index: number) {
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

      selectedItem = item;
      selectedIndex = index;
      dragging = true
      onDrag(item);

      if (selected.length > 1) {
        taggingAlong = true;
      }

      x = e.clientX
      y = e.clientY
      drag(e)
      target.removeEventListener('pointermove', rePointermove);
      target.addEventListener('pointermove', drag)
    }

    let prevDropZone = dropZone;

    function drag(e: any) {
      shiftX = e.clientX - x;
      shiftY = e.clientY - y;

      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      dropZone = elementBelow?.closest('.drop-zone') ?? null;

      if (dropZone !== prevDropZone) {
        if (dropZone) {
          const i = Number(dropZone.getAttribute('data-drop-index'))
          const index = i === -1 ? 0 : i === n + 1 ? n : i;
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
        shiftX = 0;
        shiftY = 0;
        onDrop(dropIndex === null ? selectedIndex! : dropIndex)
        // delaying prevents a swatch that is dropped in its original position from being reselected.
        queueTask(() => dragging = false);
        target.removeEventListener('pointermove', drag)
      }
      target.removeEventListener('pointermove', rePointermove)
      target.removeEventListener('pointerup', rePointerUp)
    }
  }


  function adjustX(x: number, item: T, index: number) {
    if (index === selectedIndex || selectedIndex === null) return x;
    const delta = Math.abs(index - selectedIndex);
    const shift = delta * 24 + delta * 44
    const nudge = (selected.indexOf(selectedItem!) - selected.indexOf(item)) * 8
    return index < selectedIndex ? x + shift - nudge : x - shift - nudge
  }

  function toZIndex(index: number) {
    if (selectedIndex === null || index <= selectedIndex) return 150;
    const delta = selectedIndex - index
    return 150 + delta;
  }


  function makeDraggable(node: HTMLElement, item: T, index@: Ion<number>) {
    get dragged = ion(() => isSelected(item) && dragging);
    get tagalong = ion(() => taggingAlong && dragged && index !== selectedIndex);
    const $node = asJSX(node);

    <$node
      on:pointerdown={(e){ maybeDrag(e, item, index) }}
      on:transitionend={(){ taggingAlong = false }}
      class={{
        'tag-along': tagalong@,
        'dragged': dragged@,
      }}
      style=\`
        z-index: \${(dragged ? toZIndex(index) : 0)@};
        transform: \${(dragged ? \`translate(\${adjustX(shiftX, item, index)}px, \${shiftY}px)\` : undefined)@};
      \`
    />
  }

  <o-style>
    .dragged {
      cursor: grabbing;
      box-shadow: -5px 0px 5px 0px rgba(0, 0, 0, 0.25);
    }
  
    .tag-along {
      transition: transform 67ms ease;
    }
  </o-style>


  function DropZones() {
    <:>
      {If(dragging@,
        <div class='dropzones'>
          <div class='drop-zone' data-drop-index={-1}></div>
          {Thru(n + 1, count =>
            <div
              class='drop-zone'
              data-drop-index={count - 1}
            ><Arrow/></div>
          )}
          <div class='drop-zone' data-drop-index={n + 1}></div>
        </div>
      )}

      <o-style>
        .drop-zone {
          z-index: 200;
          opacity: 0;
        }

        .drop-target {
          opacity: 1;
        }
      </o-style>
    </:>
  }

  return {
    makeDraggable,
    dragging@,
    DropZones
  }
}
  
`

Palettable.tsxDraggableKit = `function DraggableKit<T>(config: {
  n: number,
  onDrag: (item: T) => void,
  onDrop: (dropIndex: number) => void,
  isSelected: (item: T) => boolean,
  $selected: Ion<T[]>
}) {
  const { n, onDrag, onDrop, isSelected, $selected } = config

  let selectedItem: T | null = null;
  let selectedIndex: number | null = null;
  let dropIndex: number | null = null;
  let dropZone: Element | null = null;

  const $dragging = ion(false)
  const $taggingAlong = ion(false) // tag-along transition
  const $shiftX = ion(0)
  const $shiftY = ion(0)

  function maybeDrag(e: PointerEvent, item: T, index: number) {
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

      selectedItem = item;
      selectedIndex = index;
      $dragging.value = true
      onDrag(item);

      if ($selected().length > 1) {
        $taggingAlong.value = true;
      }

      x = e.clientX
      y = e.clientY
      drag(e)
      target.removeEventListener('pointermove', rePointermove);
      target.addEventListener('pointermove', drag)
    }

    let prevDropZone = dropZone;

    function drag(e: any) {
      $shiftX.value = e.clientX - x;
      $shiftY.value = e.clientY - y;

      const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
      dropZone = elementBelow?.closest('.drop-zone') ?? null;

      if (dropZone !== prevDropZone) {
        if (dropZone) {
          const i = Number(dropZone.getAttribute('data-drop-index'))
          const index = i === -1 ? 0 : i === n + 1 ? n : i;
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
      if ($dragging()) {
        target.releasePointerCapture(e.pointerId)
        $shiftX.value = 0;
        $shiftY.value = 0;
        onDrop(dropIndex === null ? selectedIndex! : dropIndex)
        // delaying prevents a swatch that is dropped in its original position from being reselected.
        queueTask(() => $dragging.value = false);
        target.removeEventListener('pointermove', drag)
      }
      target.removeEventListener('pointermove', rePointermove)
      target.removeEventListener('pointerup', rePointerUp)
    }
  }


  function adjustX(x: number, item: T, index: number) {
    if (index === selectedIndex || selectedIndex === null) return x;
    const delta = Math.abs(index - selectedIndex);
    const shift = delta * 24 + delta * 44
    const selected = $selected()
    const nudge = (selected.indexOf(selectedItem!) - selected.indexOf(item)) * 8
    return index < selectedIndex ? x + shift - nudge : x - shift - nudge
  }

  function toZIndex(index: number) {
    if (selectedIndex === null || index <= selectedIndex) return 150;
    const delta = selectedIndex - index
    return 150 + delta;
  }


  function makeDraggable(node: HTMLElement, item: T, $index: Ion<number>) {
    const $dragged = ion(() => isSelected(item) && $dragging());
    const $tagalong = ion(() => $taggingAlong() && $dragged() && $index() !== selectedIndex);
    const $node = asJSX(node);

    <$node
      on:pointerdown={e => maybeDrag(e, item, $index())}
      on:transitionend={() => $taggingAlong.value = false}
      class={{
        'tag-along': $tagalong,
        'dragged': $dragged,
      }}
      style={{
        'z-index': () => $dragged() ? toZIndex($index()) : 0,
        'transform': () => $dragged() ? \`translate(\${adjustX($shiftX(), item, $index())}px, \${$shiftY()}px)\` : undefined
      }}
    />
  }

  Style(css\`
    .dragged {
      cursor: grabbing;
      box-shadow: -5px 0px 5px 0px rgba(0, 0, 0, 0.25);
    }
  
    .tag-along {
      transition: transform 67ms ease;
    }
  \`)


  function DropZones() {
    return <>
      {If($dragging,
        <div class='dropzones'>
          <div class='drop-zone' data-drop-index={-1}></div>
          {Thru(n + 1, count =>
            <div
              class='drop-zone'
              data-drop-index={count - 1}
            ><Arrow/></div>
          )}
          <div class='drop-zone' data-drop-index={n + 1}></div>
        </div>
      )}

      {Style(css\`
        .drop-zone {
          z-index: 200;
          opacity: 0;
          transition: opacity 150ms ease-in-out;
        }

        .drop-target {
          opacity: 1;
        }
      \`)}
    </>
  }

  return {
    makeDraggable,
    $dragging,
    DropZones
  }
}`



Palettable.nsxColorsKit = `type Color = {
  h: number,
  s: number,
  l: number,
}

const genColor = useRandomColorGenerator()

function ColorsKit(size: number) {
  const n = size - 1
  const [h, s, l] = genColor()
  const goal = goalHue(h)
  const hues = getSteps(h, goal, n).map(hue => hue % 360)
  const sats = getSteps(s, (s + 30) % 100, n)
  const lights = getSteps(l, (l + 30) % 100, n)

  const sortedColors = composeColorArray(hues, sats, lights)
  const reverseColors = sortedColors.toReversed()

  const colors = ionic(shuffle([...sortedColors]), {
    moveColors(items: Set<Color>, index: number) {
      moveUniqueItems(items, this, index)
    }
  })

  get sorted = ion(() => {
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

  while (sorted) {
    shuffle(colors)
  }

  return {
    colors,
    sorted@
  }
}

function useRandomColorGenerator() {
  let previous = ''
  return function genColor(): [number, number, number] {
    const h = Math.floor(Math.random() * 360);
    const s = 30 + Math.floor(Math.random() * 40);
    const l = 30 + Math.floor(Math.random() * 40);
    const color = \`\${h}+\${s}+\${l}\`
    if (color === previous) 
      return genColor();
    previous = \`\${h}+\${s}+\${l}\`
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
  if (hueGap < 60 || hueGap > 120) 
    return goalHue(baseHue)
  return h;
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

function composeColorArray(hues: number[], sats: number[], lights: number[]) {
  const colors = []
  for (let i = 0; i < hues.length; i++) {
    const color = {
      h: hues[i],
      s: sats[i],
      l: lights[i]
    }
    colors.push(color)
  }
  return colors
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}`

Palettable.tsxColorsKit = `type Color = {
  h: number,
  s: number,
  l: number,
}

const genColor = useRandomColorGenerator()

function ColorsKit(size: number) {
  const n = size - 1
  const [h, s, l] = genColor()
  const goal = goalHue(h)
  const hues = getSteps(h, goal, n).map(hue => hue % 360)
  const sats = getSteps(s, (s + 30) % 100, n)
  const lights = getSteps(l, (l + 30) % 100, n)

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

function useRandomColorGenerator() {
  let previous = ''
  return function genColor(): [number, number, number] {
    const h = Math.floor(Math.random() * 360);
    const s = 30 + Math.floor(Math.random() * 40);
    const l = 30 + Math.floor(Math.random() * 40);
    const color = \`\${h}+\${s}+\${l}\`
    if (color === previous) 
      return genColor();
    previous = \`\${h}+\${s}+\${l}\`
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
  if (hueGap < 60 || hueGap > 120) 
    return goalHue(baseHue)
  return h;
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

function composeColorArray(hues: number[], sats: number[], lights: number[]) {
  const colors = []
  for (let i = 0; i < hues.length; i++) {
    const color = {
      h: hues[i],
      s: sats[i],
      l: lights[i]
    }
    colors.push(color)
  }
  return colors
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}`

Palettable.nsxCelebrationKit = `
function CelebrationKit(sorted@: Ion<boolean>, onComplete: () => void) {

  observe(sorted@, () => {
    if (sorted) {
      setTimeout(celebrate, 250)
    }
  })

  get magnifiedIndex = ion(undefined as number | undefined);

  function celebrate() {
    magnifiedIndex = 0;
    const id = setInterval(() => {
      magnifiedIndex++
      if (magnifiedIndex === 7) {
        clearInterval(id)
        magnifiedIndex = undefined
        onComplete()
      }
    }, 84)
  }

  function magnified(index: number) {
    return index === magnifiedIndex;
  }

  return {
    makeMagnifyable(node: HTMLElement, index@: Ion<number>) {
      const $node = asJSX(node);

      <$node
        class={{ 'magnifying': (magnifiedIndex !== undefined)@ }}
        style=\`transform: \${(magnified(index) ? 'scale(1.25)' : 'scale(1)')@}\`
      ></$node>

      <o-style>
        .magnifying {
          transition: transform 90ms ease-in;
        }
      </o-style>
    }
  }
}
  

`

Palettable.tsxCelebrationKit = `
function CelebrationKit($sorted: Ion<boolean>, onComplete: () => void) {

  observe($sorted, () => {
    if ($sorted()) {
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
        onComplete()
      }
    }, 84)
  }

  function magnified(index: number) {
    return index === $magnifiedIndex();
  }

  return {
    makeMagnifyable(node: HTMLElement, $index: Ion<number>) {
      const $node = asJSX(node);

      <$node
        class={{ 'magnifying': () => $magnifiedIndex() !== undefined }}
        style={{
          'transform': () => magnified($index()) ? 'scale(1.25)' : 'scale(1)'
        }}
      ></$node>

      Style(css\`
        .magnifying {
          transition: transform 90ms ease-in;
        }
      \`)
    }
  }
}`
