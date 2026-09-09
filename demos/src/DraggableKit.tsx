import { asJSX, css, If, ion, Ion, queueTask, RenderTag, Style, Thru } from "luent";

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
  DropMarker: RenderTag
}) {
  const { n, onDrag, onDrop, isSelected, $selected, axis = 'horizontal', DropMarker } = config

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

      // Find the element underneath the pointer
      const elementBelow = deepElementFromPoint(e.clientX, e.clientY);
      // dropZone = composedClosest(elementBelow, '.drop-zone');
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
        onDrop(dropIndex === null ? selectedIndex! : dropIndex)
        // delaying prevents a swatch that is dropped in its original position from being reselected.
        queueTask(() => $dragging.value = false);
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
    const shift = delta * 24 + delta * 44
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
    const $tagalong = ion(() => $taggingAlong() && $dragged() && $index() !== selectedIndex);
    const $node = asJSX(node);

    const $transform = ion(() => axis === 'horizontal'
      ? `translate(${adjustX($shiftX(), item, $index())}px, ${$shiftY()}px)`
      : `translate(${$shiftY()}px, ${adjustX($shiftX(), item, $index())}px)`
    );

    <$node
      on:pointerdown={e => maybeDrag(e, item, $index())}
      on:transitionend={() => $taggingAlong.value = false}
      class={{
        'tag-along': $tagalong,
        'dragged': $dragged,
      }}
      style={{
        'z-index': () => $dragged() ? order($index()) : 0,
        'transform': () => $dragged() ? $transform() : undefined
      }}
    />
  }

  Style(css`
    .dragged {
      cursor: grabbing !important;
      box-shadow: -5px 0px 5px 0px rgba(0, 0, 0, 0.25);
    }
  
    .tag-along {
      transition: transform 67ms ease;
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
            ><DropMarker/></div>
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

