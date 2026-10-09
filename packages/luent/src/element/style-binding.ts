import { Ion } from "@luently/quarky";
import { isFunction } from "@luently/utils"

type DynamicStylePropertyKit = {
  key: string;
  strings: TemplateStringsArray,
  ions: Ion<any>[]
}

export function css(strings: TemplateStringsArray, ...values: any[]) {
  let cssText = ''
  const cssStrings: string[] = []
  const dynamicProperties: DynamicStylePropertyKit[] = []

  let key = ''

  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    const prevString = strings[i - 1]
    const nextString = strings[i + 1]
    if (isFunction(value)) {
      if (!key) {
        key = extractKey(prevString)
      }
    }
    else {
      cssText + value
    }
  }
}

function extractKey(string: string) {
  const end = string.lastIndexOf(':')
  const i = string.lastIndexOf(';')
  const start = i < -1 ? 0 : i + 1;
  return string.slice(start, end).trim()
}




// color: ${color}; border: ${$lineWidth}px solid ${$borderColor}; width: 20px; height: ${$height}px; opacity: ${$opacity}
// color: ${color}; border: 1px solid ${$borderColor}; width: 20px; height: ${$height}px; opacity: ${$opacity}

// ['color: ', '; border: 1px solid ', '; width: 20px; height: ', 'px; opacity: ', 'z-index: 0; background-color : green']

function toDynamicStyleEntry(prevString: string, fn: Function, nextString: string): { key: string, ion: Ion<string> } {
  const key = extractKey(prevString)

}



function createDerivation(fn) {

}



function composeCSSText(strings: TemplateStringsArray, values: string[]) {
  return strings.reduce((cssText, string, i) => {
    if (i < values.length) {
      const value = values[i]
      if (isFunction(value)) {

      }
    }
    return cssText + string + (i < values.length ? values[i] : '')
  }, '')
}