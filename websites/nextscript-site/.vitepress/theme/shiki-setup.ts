import nsxGetInjectionGrammar from '../../../../plugins/vscode-nextscript/grammar/nsx-get.injection.tmLanguage.json'
import dusky from './dusky.json'
import goldenHour from './golden-hour.json'
import { ThemeRegistrationResolved } from 'shiki/types'

const tokenColors = [
  {
    scope: [
      'punctuation.section.embedded.begin.tsx',
      'punctuation.section.embedded.end.tsx',
      'punctuation.section.embedded.begin.jsx',
      'punctuation.section.embedded.end.jsx'
    ],
    settings: {
      foreground: '#A6ACCDC0'
    }
  },
  {
    scope: [
      'meta.embedded.expression meta.brace.round',
      'meta.arrow punctuation.definition.parameters'
    ],
    settings: {
      foreground: '#A6ACCDC0'
    }
  },
  {
    scope: [
      'keyword.operator.at'
    ],
    settings: {
      foreground: '#A6ACCDC0'
    }
  },
  {
    scope: [
      'string'
    ],
    settings: {
      foreground: '#a09627'
    }
  }
]

const nsxGetPatterns = (nsxGetInjectionGrammar.patterns ?? []).map(pattern => ({
  ...pattern
}))

export const nsxGrammar = {
  name: 'nsx',
  scopeName: 'source.nsx',
  aliases: ['ns'],
  patterns: [
    { include: 'source.tsx' }
  ],
  repository: {},
  injections: {
    'L:source.nsx -comment -string': {
      patterns: nsxGetPatterns
    }
  }
}

export const shikiThemeNames = {
  light: 'golden-hour',
  dark: 'dusky'
} as const

export const shikiThemes = [goldenHour, dusky]

export const shikiLanguages = ['ts', 'tsx', nsxGrammar] as const

export const markdownShikiConfig = {
  theme: {
    light: goldenHour as unknown as ThemeRegistrationResolved,
    dark: dusky as unknown as ThemeRegistrationResolved,
  },
  languages: [...shikiLanguages]
}
