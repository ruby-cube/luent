import { isGetter, isIon, MutableIon, atRender, queueTask, RUN_EAGERLY, swiftUpdate, toValue, trackForRender, Ion, watch } from "@rue/quarky";
import { MaybeIon } from "../component/x-Input";
import { getFlask } from "@rue/flask";
import { toString } from './attributes'
import { AnyObject } from "@rue/types";

// | Property                    | Elements                            | Typical event      | Notes                                     |
// | --------------------------- | ----------------------------------- | ------------------ | ----------------------------------------- |
// | `value`                     | `<input>`, `<textarea>`, `<select>` | `input`            | Most important case                       |
// | `checked`                   | Checkbox/radio inputs               | `input`            | Boolean selection state                   |
// | `selectedIndex`             | `<select>`                          | `input`            | Alternative to `value`                    |
// | `files`                     | `<input type="file">`               | `input`            | Read-only from JS in practice             |

// | `innerHTML` / `textContent` | contenteditable                     | `input`            | Often used for editors                    |

// | `open`                      | `<details>`                         | `toggle`           | Nice candidate for disclosure state       |
// | `open`                      | `<dialog>`                          | `close`            | Modal state synchronization               |

// | `currentTime`               | `<video>`, `<audio>`                | `timeupdate`       | Media scrubbers                           |
// | `playbackRate`              | Media elements                      | `ratechange`       | Legitimate synchronized state             |
// | `volume` / `muted`          | Media elements                      | `volumechange`     | Common media UI                           |
// | `paused`                    | Media elements                      | `play` / `pause`   | Slightly awkward because methods drive it |


export function isMutableIon(ion: unknown): ion is MutableIon<any> {
  return isIon(ion) && 'value' in ion
}

export function setUpMutables(element: Element, mutables: { [key: string]: MaybeIon<any> }) {
  for (const key in mutables) {
    if (!(key in element)) continue;
    bindMutable(element, key, mutables[key], getEvent(element, key as keyof Element))
  }
}

function getEvent(element: Element, key: keyof Element) {
  const map = eventMap[element.tagName as keyof typeof eventMap]
  if (!map) return 'input'
  const event = map[key as keyof typeof map]
  if (!event) {
    if (__DEV__) console.warn('Invalid mutable binding for', element.tagName.toLowerCase(), ':', key)
    return ''
  }
  return event;
}

const mediaEventMap = {
  currentTime: 'timeupdate',
  playbackRate: 'ratechange',
  volume: 'volumechange',
  muted: 'volumechange'
}

const eventMap = {
  DETAILS: { open: 'toggle' },
  DIALOG: { open: 'close' },
  VIDEO: mediaEventMap,
  AUDIO: mediaEventMap
}

function bindMutable(element: AnyObject, key: PropertyKey, mutable: MaybeIon<any>, event: string) {
  if (!event) return;
  if (!isGetter(mutable)) {
    if (__DEV__) console.warn('mu binding must receive a mutable ion for two-way binding to work', mutable)
  }
  else {
    element.addEventListener(event, () => {
      forMutableIon(mutable, ion => {
        ion.value = element[key]
      })
    })
    watch(mutable, () => {
      forMutableIon(mutable, ion => {
        element[key] = ion.value
      })
    }, { eager: true })
  }
}

function forMutableIon(maybeIon: Ion<any>, task: (ion: MutableIon<any>) => void) {
  if ('value' in maybeIon) {
    task(maybeIon)
  }
  else {
    const ion = maybeIon()
    if (isMutableIon(maybeIon)) {
      task(ion)
    }
    else {
      if (__DEV__) throw new Error('invalid two-way binding')
    }
  }
}



// function bindTextarea(element: Element, Slot: RenderSlot | undefined) {
//    if (!Slot || !isFunction(Slot)) return;
//    const nodeEntities = Slot();
//    const kit = nodeEntities instanceof Array ? nodeEntities[0] : nodeEntities;
//    if (!isPlainObject(kit) && !('mu' in kit)) return;
//    const ion = kit.mu;
//    const flask = getFlask()
//    trackForRender(ion, () => {
//       queueInternalRender(() => {
//          element.value = toString(ion())
//       }, flask)
//    }, flask, RUN_EAGERLY)
//    if (!isMutableIon(ion)) {
//       if ( __DEV__) console.warn('mu:value must receive a mutable ion for two-way binding to work')
//    }
//    else {
//       setUpInputListener(element, ion)
//    }
//    return ion;
// }


