import type { CodeMapping } from "@volar/language-core/lib/types"

export type Capabilities = CodeMapping['data']

export type BaseCapabilities = {
   completion: true,
   navigation: true,
   semantic: true,
   verification: true
}

export type NoCapabilities = {
   completion: false,
   navigation: false,
   semantic: false,
   verification: false
}

const BASE_CAPABILITIES = {
   verification: true,
   semantic: true,
   navigation: true,
   completion: true,
};

const NO_CAPABILITIES = {
   verification: false,
   completion: false,
   semantic: false,
   navigation: false,
};

const SEMANTIC_ONLY = {
  verification: true,
  semantic: true,
  navigation: true,
  completion: false,
};

const COMPLETION_ONLY = {
   completion: true,
  verification: false,
  semantic: false,
  navigation: false,
};

const STRUCTURE_ONLY = {
  verification: false,
  completion: false,
  semantic: false,
  navigation: false,
  structure: true,
};

