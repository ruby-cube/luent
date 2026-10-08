
import { Ion, queueTask, As, JSX, ContextKey, css, For, fromContext, FromTag, If, ion, ionic, Style, Thru, observe, Else, Bindings } from "luent";
import { moveUniqueItems } from "@luent/utils";

export function DayView(setup: FromTag<{
  date: Date
}>) {
  const $view = ion('timeline' as 'timeline' | 'list', {
    toggle() {
      $view.value = $view() === 'timeline'
        ? 'list'
        : 'timeline'
    }
  })
  return <>
    {/* <CalendarNav /> */}
    <WeekNav start={new Date('2026/08/30')} />
    <DayHeader date={}/>
    {If(() => $view() === 'timeline',
      <TimelineView />
    )}
    {Else(
      <ListView />
    )}
  </>
}

function formatDate(date: Date): string {
  const day = date.toLocaleDateString('en-US', { weekday: 'long' })
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const dayOfMonth = date.getDate()
  const year = date.getFullYear()

  return `${day} - ${month} ${dayOfMonth}, ${year}`
}

function DayHeader(setup: FromTag<{
  date: Date
}>) {
  const { date } = setup
  return <>
    <h3>{formatDate(date)}</h3>
  </>
}

function TimelineView() {
  return <>
  </>
}

function ListView() {
  return <>
  </>
}

function CalendarNav() {
  return <>
    <div class='calendar-nav'>

    </div>
    {Style(css`
      .calendar-nav {
        
      }
    `)}
  </>
}

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function formatDayOfWeek(day: DayOfWeek) {
  return daysOfWeek[day]
}


function formatDateDay(start: Date, day: DayOfWeek): string {
  // Create a copy to avoid mutating the original Date instance
  const targetDate = new Date(start.getTime());

  // Add the offset days (0 for Sunday, 6 for Saturday)
  targetDate.setDate(targetDate.getDate() + day);

  // Return the calendar day of the month as a string
  return String(targetDate.getDate());
}


// TODO: assumes sunday start date. Does not currently handle Saturday start dates
function WeekNav(setup: FromTag<{
  activeDate?: Ion<Date>;
  start: Date;
  onClickDate: (day: DayOfWeek) => void
}>) {
  const { start, $activeDate, onClickDate } = setup

  return <>
    <div class='week'>
      {Thru(7, (_: number, day: DayOfWeek) =>
        <div class='day'>
          <div>{formatDayOfWeek(day)}</div>
          <div on:click={() => onClickDate(day)}>
            {formatDateDay(start, day)}
          </div>
        </div>
      )}
    </div>
    
    {Style(css`
      .week {
        display: flex;
        flex-direction: row;
        max-width: 20rem;
        min-width: 20rem;
        border: 1px solid green;
        justify-content: space-between;
      }

      .day {
        display: flex;
        flex-direction: column;
        flex-basis: 1;
        padding: 1rem 1rem;
        text-align: center;
      }
    `)}
  </>
}

interface Item {
  id: string;
  title: string;
}


export function TimelineList(items: Item[]) {
  return <>
    <div></div>
  </>
}



function ColorPalette(setup: FromTag<{
  size?: number;
  onMove: () => void;
  onComplete: () => void;
}>) {
  const { onMove, onComplete, ...rest } = setup

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


  return <>
    <o--host on:click={e => e.from('.clickable') || deselectAll()} />
    <div class='container' auto-bind={rest}>
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
        {DropZones()}
      </div>
    </div>

    {Style(css`
      .container {
        display: flex;
        flex-direction: column;
        touch-action: none;
      }
      
      .row {
        position: relative;
        display: flex;
        margin-inline: auto;
      }

      .clickable {
        cursor: pointer;
      }

      .palettable .selected {
        outline: 5px solid hsla(35deg 10% 50% / 50%);
      }

      .square {
        width: 44px;
        height: 44px;
        border-radius: 10px;
      }

      @media (max-width: 479px) {
        .square {
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

      @media (max-width: 479px) {
        .chevron-arrow {
          max-width: 16px;
        }
        .chevron-down {
          max-width: 12px;
        }
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
