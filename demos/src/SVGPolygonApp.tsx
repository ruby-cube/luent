import { component, template, For, FromTag, Style, css, $$, } from "luent"
import { as, ion, ionic, EACH, Ion, Ionic } from "@luently/quarky"

// Demo from Vue.js
// features
// - svg

type Stat = {
  label: string,
  value: number
}

export function SVGPolygonApp() {
  const $newLabel = ion('')

  const stats = ionic([
    { label: 'A', value: 100 },
    { label: 'B', value: 100 },
    { label: 'C', value: 100 },
    { label: 'D', value: 100 },
    { label: 'E', value: 100 },
    { label: 'F', value: 100 }
  ], { [EACH]: { '-as': ionic } })


  function add(e: any) {
    e.preventDefault()
    if (!$newLabel()) return
    stats.push(ionic({
      label: $newLabel(),
      value: 100
    }))
    $newLabel.value = ''
  }

  function remove(stat: Ionic<Stat>) {
    if (stats.length > 3) {
      stats.splice(stats.indexOf(stat), 1)
    } else {
      alert("Can't delete more!")
    }
  }

  return (

    <>
      <svg width="200" height="200">
        <PolyGraph stats={stats}></PolyGraph>
      </svg >

      {For(stats, $stat =>
        <div>
          <label>{() => $stat().label}</label>
          <input type="range" mu:value={$$($stat()).value} min="0" max="100" />
          <span>{() => $stat().value}</span>
          <button on:click={e => remove($stat())} class="remove">X</button>
        </div>
      )}

      <form id="add">
        <input name="newlabel" mu:value={$newLabel} />
        <button on:click={add}>Add a Stat</button>
      </form>

      <pre id="raw">{() => JSON.stringify(stats, undefined, 2)}</pre>
      {Style(css`
            polygon {
               fill: #42b983;
               opacity: 0.75;
            }

            circle {
               fill: transparent;
               stroke: #999;
            }

            text {
               font-size: 10px;
               fill: #666;
            }

            label {
               display: inline-block;
               margin-left: 10px;
               width: 20px;
            }

            #raw {
               position: absolute;
               top: 0;
               left: 300px;
            }
         `)}
    </>
  )
}

// const replacer = (_key: string, val: unknown): any => {
//    if (isRef(val)) {
//      return replacer(_key, val.value)
//    } else if (isMap(val)) {
//      return {
//        [`Map(${val.size})`]: [...val.entries()].reduce(
//          (entries, [key, val], i) => {
//            entries[stringifySymbol(key, i) + ' =>'] = val
//            return entries
//          },
//          {} as Record<string, any>,
//        ),
//      }
//    } else if (isSet(val)) {
//      return {
//        [`Set(${val.size})`]: [...val.values()].map(v => stringifySymbol(v)),
//      }
//    } else if (isSymbol(val)) {
//      return stringifySymbol(val)
//    } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
//      // native elements
//      return String(val)
//    }
//    return val
//  }


function AxisLabel(setup: FromTag<{
  stat: Ion<Ionic<Stat>>,
  index: Ion<number>,
  total: Ion<number>
}>) {
  const { $index, $stat, $total } = setup

  const $point = ion(() =>
    valueToPoint(+$stat().value + 10, $index(), $total())
  )

  return (
    <text x={() => $point().x} y={() => $point().y}>{() => $stat().label}</text>

  )
}


function PolyGraph({ stats }: {
  stats: Ionic<Ionic<Stat>[]>
}) {

  const $points = ion(() => {
    const total = stats.length
    return stats
      .map((stat, i) => {
        const { x, y } = valueToPoint(stat.value, i, total)
        return `${x},${y}`
      })
      .join(' ')
  })

  return (

    <g>
      <polygon points={$points}></polygon>
      <circle cx="100" cy="100" r="80"></circle>
      {For(stats, ($stat, index) =>
        <AxisLabel
          stat={$stat}
          index={index}
          total={$$(stats).length}
        >
        </AxisLabel>
      )}
    </g>
  )
}

function valueToPoint(value: number, index: number, total: number) {
  const x = 0
  const y = -value * 0.8
  const angle = ((Math.PI * 2) / total) * index
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const tx = x * cos - y * sin + 100
  const ty = x * sin + y * cos + 100
  return {
    x: tx,
    y: ty
  }
}
